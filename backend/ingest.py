from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

import fitz
from chromadb.config import Settings
from dotenv import load_dotenv
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

ENV_FILE = Path(__file__).resolve().parent / ".env"
load_dotenv(ENV_FILE)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = PROJECT_ROOT / "docs"
USER_DOCS_DIR = DOCS_DIR / "uploads"
CHROMA_DIR = PROJECT_ROOT / "chroma_db"
STATE_FILE = CHROMA_DIR / "ingestion_state.json"
COLLECTION_NAME = "real_estate_documents"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


@dataclass
class IngestionSummary:
    status: str
    documents_processed: int
    total_chunks_added: int
    per_document: list[dict[str, Any]]
    last_ingested: str | None


@lru_cache(maxsize=1)
def get_embeddings() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)


@lru_cache(maxsize=1)
def get_chroma_settings() -> Settings:
    return Settings(
        is_persistent=True,
        persist_directory=str(CHROMA_DIR),
        anonymized_telemetry=False,
    )


def get_vectorstore() -> Chroma:
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    return Chroma(
        collection_name=COLLECTION_NAME,
        persist_directory=str(CHROMA_DIR),
        embedding_function=get_embeddings(),
        client_settings=get_chroma_settings(),
    )


def load_state() -> dict[str, Any]:
    if not STATE_FILE.exists():
        return {"documents": {}, "last_ingested": None}

    with STATE_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_state(state: dict[str, Any]) -> None:
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    with STATE_FILE.open("w", encoding="utf-8") as file:
        json.dump(state, file, indent=2)


def file_signature(file_path: Path) -> str:
    digest = hashlib.sha256()
    stat = file_path.stat()
    digest.update(file_path.name.encode("utf-8"))
    digest.update(str(stat.st_size).encode("utf-8"))
    digest.update(str(stat.st_mtime_ns).encode("utf-8"))
    return digest.hexdigest()


def list_pdf_files() -> list[Path]:
    if not USER_DOCS_DIR.exists():
        return []
    return sorted(path for path in USER_DOCS_DIR.rglob("*.pdf") if path.is_file())


def extract_documents_from_pdf(file_path: Path) -> list[Document]:
    page_documents: list[Document] = []

    with fitz.open(file_path) as pdf:
        for page_index, page in enumerate(pdf, start=1):
            text = page.get_text("text").strip()
            if not text:
                continue

            page_documents.append(
                Document(
                    page_content=text,
                    metadata={
                        "source": file_path.name,
                        "page": page_index,
                        "file_path": str(file_path),
                    },
                )
            )

    return page_documents


def split_documents(documents: list[Document]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        encoding_name="cl100k_base",
    )
    return splitter.split_documents(documents)


def delete_missing_files(vectorstore: Chroma, state: dict[str, Any], current_files: set[str]) -> None:
    tracked_files = set(state.get("documents", {}).keys())
    removed_files = tracked_files - current_files
    if not removed_files:
        return

    for filename in removed_files:
        vectorstore.delete(where={"source": filename})
        state["documents"].pop(filename, None)


def ingest_documents() -> IngestionSummary:
    pdf_files = list_pdf_files()
    state = load_state()
    vectorstore = get_vectorstore()
    current_filenames = {path.name for path in pdf_files}
    delete_missing_files(vectorstore, state, current_filenames)

    processed_count = 0
    total_chunks_added = 0
    per_document: list[dict[str, Any]] = []

    for pdf_path in pdf_files:
        signature = file_signature(pdf_path)
        previous_record = state.get("documents", {}).get(pdf_path.name)

        if previous_record and previous_record.get("signature") == signature:
            per_document.append(
                {
                    "filename": pdf_path.name,
                    "status": "skipped",
                    "chunks_added": 0,
                }
            )
            continue

        raw_documents = extract_documents_from_pdf(pdf_path)
        chunks = split_documents(raw_documents)

        vectorstore.delete(where={"source": pdf_path.name})

        if chunks:
            ids = [
                f"{pdf_path.stem}-{chunk.metadata.get('page', 'na')}-{index}"
                for index, chunk in enumerate(chunks)
            ]
            vectorstore.add_documents(chunks, ids=ids)

        chunk_count = len(chunks)
        processed_count += 1
        total_chunks_added += chunk_count
        state.setdefault("documents", {})[pdf_path.name] = {
            "signature": signature,
            "chunks": chunk_count,
            "pages": len(raw_documents),
            "ingested_at": datetime.now(timezone.utc).isoformat(),
        }
        per_document.append(
            {
                "filename": pdf_path.name,
                "status": "ingested",
                "chunks_added": chunk_count,
            }
        )

    state["last_ingested"] = datetime.now(timezone.utc).isoformat() if pdf_files else None
    save_state(state)

    return IngestionSummary(
        status="success",
        documents_processed=processed_count,
        total_chunks_added=total_chunks_added,
        per_document=per_document,
        last_ingested=state["last_ingested"],
    )


def get_stats() -> dict[str, Any]:
    state = load_state()
    total_documents = len(list_pdf_files())
    total_chunks = sum(record.get("chunks", 0) for record in state.get("documents", {}).values())

    return {
        "total_documents": total_documents,
        "total_chunks": total_chunks,
        "embedding_model": EMBEDDING_MODEL_NAME,
        "last_ingested": state.get("last_ingested"),
    }


def has_ingested_content() -> bool:
    state = load_state()
    return any(record.get("chunks", 0) > 0 for record in state.get("documents", {}).values())


def get_document_listing() -> list[dict[str, Any]]:
    return [
        {
            "filename": path.name,
            "size_bytes": path.stat().st_size,
        }
        for path in list_pdf_files()
    ]


def sanitize_filename(filename: str) -> str:
    cleaned = Path(filename).name.strip()
    cleaned = re.sub(r"[^A-Za-z0-9._ -]", "_", cleaned)
    return cleaned


def save_uploaded_pdf(filename: str, content: bytes) -> dict[str, Any]:
    sanitized = sanitize_filename(filename)
    if not sanitized.lower().endswith(".pdf"):
        raise ValueError("Only PDF files are supported.")

    if not content:
        raise ValueError(f"{sanitized} is empty.")

    USER_DOCS_DIR.mkdir(parents=True, exist_ok=True)
    file_path = USER_DOCS_DIR / sanitized
    file_path.write_bytes(content)

    return {
        "filename": sanitized,
        "size_bytes": file_path.stat().st_size,
    }
