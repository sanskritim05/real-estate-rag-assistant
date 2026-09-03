import type { SourceItem } from "@/lib/api";

const CHUNK_SIZE = 1800;
const CHUNK_OVERLAP = 250;

export type SessionDocument = {
  filename: string;
  size: number;
  file: File;
  chunks: SourceItem[];
};

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

async function extractPages(file: File): Promise<Array<{ page: number; text: string }>> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages: Array<{ page: number; text: string }> = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) {
      pages.push({ page: pageNumber, text });
    }
  }

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
