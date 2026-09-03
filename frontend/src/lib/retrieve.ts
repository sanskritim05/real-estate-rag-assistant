import type { SourceItem } from "@/lib/api";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "does",
  "for",
  "from",
  "how",
  "in",
  "is",
  "of",
  "on",
  "or",
  "the",
  "to",
  "what",
  "which",
  "with",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function retrieveChunks(question: string, chunks: SourceItem[], limit = 8): SourceItem[] {
  if (!chunks.length) {
    return [];
  }

  const queryTokens = tokenize(question);
  if (!queryTokens.length) {
    return chunks.slice(0, limit);
  }

  const scored = chunks.map((chunk) => {
    const haystack = `${chunk.filename} ${chunk.chunk_text}`.toLowerCase();
    let score = 0;
    queryTokens.forEach((token) => {
      if (haystack.includes(token)) {
        score += 1;
      }
    });
    return { chunk, score };
  });

  scored.sort((left, right) => right.score - left.score || left.chunk.filename.localeCompare(right.chunk.filename));

  const selected = (scored[0]?.score ?? 0) > 0 ? scored.filter((item) => item.score > 0) : scored;
  return selected.slice(0, limit).map((item) => item.chunk);
}
