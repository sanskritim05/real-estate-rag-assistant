import type { SourceItem } from "@/lib/api";

const CHUNK_SIZE = 1800;
const CHUNK_OVERLAP = 250;

export type SessionDocument = {
  filename: string;
  size: number;
  file: File;
  chunks: SourceItem[];
};

function polyfillPdfEnvironment() {
  const promiseCtor = Promise as typeof Promise & {
    withResolvers?: () => {
      promise: Promise<unknown>;
      resolve: (value?: unknown) => void;
      reject: (reason?: unknown) => void;
    };
  };

  if (typeof promiseCtor.withResolvers !== "function") {
    promiseCtor.withResolvers = function withResolvers() {
      let resolve!: (value?: unknown) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }

  const streamProto = ReadableStream.prototype as ReadableStream & {
    [Symbol.asyncIterator]?: () => AsyncIterator<unknown>;
  };

  if (typeof streamProto[Symbol.asyncIterator] !== "function") {
    streamProto[Symbol.asyncIterator] = async function* asyncIterator() {
      const reader = this.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            return;
          }
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    };
  }
}

function splitText(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }
  if (normalized.length <= CHUNK_SIZE) {
    return [normalized];
  }

  const pieces: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    pieces.push(normalized.slice(start, end).trim());
    if (end >= normalized.length) {
      break;
    }
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }
  return pieces.filter(Boolean);
}

function itemText(item: unknown): string {
  if (item && typeof item === "object" && "str" in item && typeof item.str === "string") {
    return item.str;
  }
  return "";
}

async function extractPages(file: File): Promise<Array<{ page: number; text: string }>> {
  polyfillPdfEnvironment();

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const worker = await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url");
  const getDocument = pdfjs.getDocument;
  const GlobalWorkerOptions = pdfjs.GlobalWorkerOptions;
  const workerSrc = typeof worker.default === "string" ? worker.default : String(worker.default ?? worker);

  if (typeof getDocument !== "function") {
    throw new Error("PDF engine failed to load. Refresh the page and try again.");
  }

  GlobalWorkerOptions.workerSrc = workerSrc;

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({
    data,
    disableWorker: true,
    isEvalSupported: false,
  });
  const pdf = await loadingTask.promise;
  const pages: Array<{ page: number; text: string }> = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = Array.isArray(content.items) ? content.items : [];
    const text = items
      .map(itemText)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) {
      pages.push({ page: pageNumber, text });
    }
  }

  await pdf.destroy();
  return pages;
}

export function filesToDocuments(files: File[]): SessionDocument[] {
  return files.map((file) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      throw new Error(`${file.name} is not a PDF.`);
    }
    return {
      filename: file.name,
      size: file.size,
      file,
      chunks: [],
    };
  });
}

export function mergeDocuments(
  current: SessionDocument[],
  incoming: SessionDocument[],
): SessionDocument[] {
  const merged = new Map(current.map((document) => [document.filename, document]));
  incoming.forEach((document) => merged.set(document.filename, document));
  return Array.from(merged.values()).sort((left, right) => left.filename.localeCompare(right.filename));
}

export async function ingestDocuments(documents: SessionDocument[]): Promise<{
  documents: SessionDocument[];
  chunks: number;
  docs: number;
}> {
  const ingested: SessionDocument[] = [];
  let totalChunks = 0;
  let updatedDocs = 0;

  for (const document of documents) {
    const pages = await extractPages(document.file);
    const chunks: SourceItem[] = [];
    for (const page of pages) {
      for (const chunkText of splitText(page.text)) {
        chunks.push({
          filename: document.filename,
          page: page.page,
          chunk_text: chunkText,
        });
      }
    }
    ingested.push({ ...document, chunks });
    totalChunks += chunks.length;
    updatedDocs += 1;
  }

  return { documents: ingested, chunks: totalChunks, docs: updatedDocs };
}
