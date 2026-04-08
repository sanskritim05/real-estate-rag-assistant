from __future__ import annotations

from typing import Any

from langchain_chroma import Chroma

from ingest import COLLECTION_NAME, CHROMA_DIR, get_chroma_settings, get_embeddings


def get_retriever_store() -> Chroma:
    return Chroma(
        collection_name=COLLECTION_NAME,
        persist_directory=str(CHROMA_DIR),
        embedding_function=get_embeddings(),
        client_settings=get_chroma_settings(),
    )


def retrieve_relevant_chunks(query: str, k: int = 5) -> list[dict[str, Any]]:
    vectorstore = get_retriever_store()
    try:
        results = vectorstore.similarity_search(query, k=k)
    except Exception:  # noqa: BLE001
        return []

    return [
        {
            "filename": doc.metadata.get("source", "Unknown"),
            "page": doc.metadata.get("page", "Unknown"),
            "chunk_text": doc.page_content,
        }
        for doc in results
    ]
