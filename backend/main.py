from __future__ import annotations

import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from ingest import get_document_listing, get_stats, ingest_documents, save_uploaded_pdf
from rag_chain import answer_question

ENV_FILE = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(ENV_FILE)

app = FastAPI(title="Real Estate RAG Assistant API")


def get_allowed_origins() -> list[str]:
    raw_value = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:5173")
    return [origin.strip() for origin in raw_value.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuestionRequest(BaseModel):
    question: str = Field(..., min_length=1)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Real Estate RAG Assistant API is running."}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ask")
def ask_question(payload: QuestionRequest) -> dict:
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        return answer_question(question)
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Failed to answer question: {error}") from error


@app.post("/ingest")
def ingest() -> dict:
    try:
        summary = ingest_documents()
        return {
            "status": summary.status,
            "documents_processed": summary.documents_processed,
            "total_chunks_added": summary.total_chunks_added,
            "per_document": summary.per_document,
            "last_ingested": summary.last_ingested,
        }
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Failed to ingest documents: {error}") from error


@app.get("/stats")
def stats() -> dict:
    try:
        return get_stats()
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {error}") from error


@app.get("/documents")
def documents() -> list[dict]:
    try:
        return get_document_listing()
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {error}") from error


@app.post("/upload-documents")
async def upload_documents(files: list[UploadFile] = File(...)) -> dict:
    if not files:
        raise HTTPException(status_code=400, detail="No files were uploaded.")

    uploaded_files = []

    try:
        for file in files:
            if not file.filename:
                raise HTTPException(status_code=400, detail="One of the uploaded files is missing a filename.")

            if file.content_type not in {"application/pdf", "application/octet-stream"}:
                raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF.")

            content = await file.read()
            uploaded_files.append(save_uploaded_pdf(file.filename, content))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except HTTPException:
        raise
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Failed to upload documents: {error}") from error
    finally:
        for file in files:
            await file.close()

    return {
        "status": "success",
        "files_uploaded": len(uploaded_files),
        "documents": uploaded_files,
    }
