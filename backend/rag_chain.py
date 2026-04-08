from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq

from ingest import has_ingested_content
from retriever import retrieve_relevant_chunks

ENV_FILE = Path(__file__).resolve().parent / ".env"
load_dotenv(ENV_FILE)

MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

SYSTEM_PROMPT = """You are a real estate investment research assistant.

Answer only from the provided context.
Be specific and cite which document supports each major claim.
If the context does not contain enough information, say that explicitly.
Never fabricate or infer facts that are not grounded in the retrieved context.
Keep answers concise but complete.
Do not narrate your search process or say things like "we need to look" or "the provided context shows."
If the exact period, metric, or entity asked for is not present, say that directly in one sentence, then optionally mention the closest available figure from the context.
Prefer direct answers over meta-explanations.

When useful, mention sources inline in this format: (Source: filename, page X).
"""


def build_context(chunks: list[dict[str, Any]]) -> str:
    if not chunks:
        return "No supporting context was retrieved."

    sections = []
    for index, chunk in enumerate(chunks, start=1):
        sections.append(
            "\n".join(
                [
                    f"Context {index}",
                    f"Filename: {chunk['filename']}",
                    f"Page: {chunk['page']}",
                    f"Content: {chunk['chunk_text']}",
                ]
            )
        )
    return "\n\n".join(sections)


def get_llm() -> ChatGroq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set. Add it to backend/.env before asking questions.")

    return ChatGroq(
        api_key=api_key,
        model=MODEL_NAME,
        temperature=0.1,
    )


def answer_question(question: str) -> dict[str, Any]:
    if not has_ingested_content():
        return {
            "answer": "No documents have been ingested yet. Upload your PDFs and click Ingest Documents before starting chat.",
            "sources": [],
        }

    sources = retrieve_relevant_chunks(question, k=8)

    if not sources:
        return {
            "answer": "I could not find relevant information in the local knowledge base for that question.",
            "sources": [],
        }

    llm = get_llm()
    context = build_context(sources)
    response = llm.invoke(
        [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(
                content=f"Question: {question}\n\nContext:\n{context}\n\nAnswer using only this context."
            ),
        ]
    )

    return {
        "answer": response.content,
        "sources": sources,
    }
