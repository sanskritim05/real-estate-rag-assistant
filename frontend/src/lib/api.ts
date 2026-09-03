export type SourceItem = {
  filename: string;
  page?: number | string | null;
  chunk_text: string;
};

export type AskResponse = { answer: string; sources?: SourceItem[] };

const ASK_TIMEOUT = 60_000;

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

export async function askQuestion(question: string, chunks: SourceItem[]): Promise<AskResponse> {
  if (!chunks.length) {
    return {
      answer:
        "No documents have been ingested yet. Upload your PDFs and click Ingest Documents before starting chat.",
      sources: [],
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ASK_TIMEOUT);

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, chunks }),
      signal: controller.signal,
    });
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

    const payload = data as AskResponse;
    return { answer: payload?.answer ?? "", sources: payload?.sources ?? [] };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new TimeoutError("timeout");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
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
