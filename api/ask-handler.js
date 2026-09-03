const SYSTEM_PROMPT = `You are a real estate investment research assistant.

Answer only from the provided context.
Be specific and cite which document supports each major claim.
If the context does not contain enough information, say that explicitly.
Never fabricate or infer facts that are not grounded in the retrieved context.
Keep answers concise but complete.
Do not narrate your search process or say things like "we need to look" or "the provided context shows."
If the exact period, metric, or entity asked for is not present, say that directly in one sentence, then optionally mention the closest available figure from the context.
Prefer direct answers over meta-explanations.

When useful, mention sources inline in this format: (Source: filename, page X).`;

function buildContext(chunks) {
  if (!chunks.length) {
    return "No supporting context was retrieved.";
  }

  return chunks
    .map((chunk, index) =>
      [
        `Context ${index + 1}`,
        `Filename: ${chunk.filename}`,
        `Page: ${chunk.page ?? "not available"}`,
        `Content: ${chunk.chunk_text}`,
      ].join("\n"),
    )
    .join("\n\n");
}

async function answerWithGroq({ apiKey, model, question, chunks }) {
  const trimmedQuestion = typeof question === "string" ? question.trim() : "";
  if (!trimmedQuestion) {
    return { status: 400, body: { detail: "Question cannot be empty." } };
  }

  if (!apiKey) {
    return {
      status: 500,
      body: { detail: "GROQ_API_KEY is not set. Add it in Vercel project settings (or frontend/.env for local dev)." },
    };
  }

  const contextChunks = Array.isArray(chunks) ? chunks : [];
  if (!contextChunks.length) {
    return {
      status: 200,
      body: {
        answer:
          "I could not find relevant information in the local knowledge base for that question.",
        sources: [],
      },
    };
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || "openai/gpt-oss-20b",
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Question: ${trimmedQuestion}\n\nContext:\n${buildContext(contextChunks)}\n\nAnswer using only this context.`,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail =
      payload.error?.message || payload.detail || `Groq request failed (${response.status})`;
    return { status: 500, body: { detail } };
  }

  return {
    status: 200,
    body: {
      answer: payload.choices?.[0]?.message?.content ?? "",
      sources: contextChunks,
    },
  };
}

module.exports = { answerWithGroq };
