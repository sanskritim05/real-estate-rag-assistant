export type DocumentItem = { filename: string; size: number };

export type SourceItem = {
  filename: string;
  page?: number | string | null;
  chunk_text: string;
};

export type AskResponse = { answer: string; sources?: SourceItem[] };

const ASK_TIMEOUT = 60_000;
const UPLOAD_TIMEOUT = 120_000;
const INGEST_TIMEOUT = 180_000;

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : "")
).replace(/\/+$/, "");

export class TimeoutError extends Error {
  constructor(message = "timeout") {
    super(message);
    this.name = "TimeoutError";
  }
}

function extractDetail(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const detail = (data as { detail?: unknown; error?: unknown }).detail;
  const error = (data as { error?: unknown }).error;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

async function request<T>(path: string, init?: RequestInit, timeout = ASK_TIMEOUT): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${apiBaseUrl}${path}`, { ...init, signal: controller.signal });
    const text = await res.text();
    let data: unknown = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new Error(extractDetail(data, text.slice(0, 200) || `Request failed (${res.status})`));
    }

    return data as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new TimeoutError("timeout");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeDocs(data: unknown): DocumentItem[] {
  const raw = Array.isArray(data)
    ? data
    : ((data as { documents?: unknown[]; files?: unknown[] } | null)?.documents ??
      (data as { files?: unknown[] } | null)?.files ??
      []);

  return (raw as Array<Record<string, unknown> | string>)
    .map((item) =>
      typeof item === "string"
        ? { filename: item, size: 0 }
        : {
            filename: String(item.filename ?? item.name ?? "Untitled.pdf"),
            size: Number(item.size_bytes ?? item.size ?? item.bytes ?? 0),
          },
    )
    .sort((left, right) => left.filename.localeCompare(right.filename));
}

export async function listDocuments(): Promise<DocumentItem[]> {
  return normalizeDocs(await request<unknown>("/documents"));
}

export async function uploadDocuments(files: File[]): Promise<void> {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  await request<unknown>("/upload-documents", { method: "POST", body: form }, UPLOAD_TIMEOUT);
}

export async function ingestDocuments(): Promise<{ chunks: number; docs: number }> {
  const data = await request<Record<string, unknown>>("/ingest", { method: "POST" }, INGEST_TIMEOUT);
  return {
    chunks: Number(data.total_chunks_added ?? data.chunks ?? data.chunks_added ?? 0),
    docs: Number(data.documents_processed ?? data.documents ?? data.docs ?? data.updated_documents ?? 0),
  };
}

export async function askQuestion(question: string): Promise<AskResponse> {
  const data = await request<AskResponse>("/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  return { answer: data?.answer ?? "", sources: data?.sources ?? [] };
}

export function formatSize(bytes: number): string {
  if (!bytes || bytes < 0) {
    return "-";
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
