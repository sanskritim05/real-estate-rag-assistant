# Real Estate RAG Assistant

Real Estate RAG Assistant is a local-first research tool for analyzing real estate PDFs such as market reports, homebuying guides, rental outlooks, and housing data publications. Users upload PDF files directly through the website, ingest them into a local vector database, and then ask natural language questions through a React interface that returns grounded answers with source citations.

## Demo

[Watch the demo video](./demo-for-project.mp4)

## What Is RAG?

RAG stands for Retrieval-Augmented Generation.

In plain English, it means:

1. Your documents are broken into smaller chunks.
2. Those chunks are converted into embeddings, which are numerical representations of meaning.
3. When you ask a question, the app finds the most relevant chunks first.
4. The LLM answers using those retrieved chunks instead of guessing.

That makes responses more grounded, more traceable, and much more useful for document-heavy research workflows.

## Features

- Direct PDF upload through the website
- User-only document flow via `docs/uploads/`
- Persistent local ChromaDB storage
- Hugging Face local embeddings with `sentence-transformers/all-MiniLM-L6-v2`
- Groq-powered answer generation
- Source-aware answers with document filename, page number, and chunk preview
- FastAPI backend and React + Vite frontend
- Re-ingestion protection so unchanged PDFs do not get duplicated

## Free Real Estate PDF Sources

- Zillow Research: https://www.zillow.com/research/
- National Association of Realtors (NAR): https://www.nar.realtor/research-and-statistics
- HUD: https://www.hud.gov/
- FHFA: https://www.fhfa.gov/

## Project Structure

```text
real-estate-rag-assistant/
├── backend/
│   ├── main.py
│   ├── ingest.py
│   ├── retriever.py
│   ├── rag_chain.py
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── SourceCard.jsx
│   │   │   ├── DocumentManager.jsx
│   │   │   └── ResearchGuide.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── docs/
│   └── uploads/
├── chroma_db/
├── .gitignore
└── README.md
```

## Local Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn main:app --reload
```

Example `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
BACKEND_CORS_ORIGINS=http://localhost:5173
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and the backend runs on `http://localhost:8000`.

## How To Use The App

1. Start the backend and frontend.
2. Open the React app in the browser.
3. Upload one or more PDF files in the sidebar.
4. Review the uploaded files in the list.
5. Click `Ingest Documents`.
6. Wait for the success message.
7. Ask questions in the chat panel.

## Example Questions

- What does the rental report say about year-over-year rent growth?
- Which document discusses home affordability constraints?
- Summarize the latest housing price trends from the FHFA documents.
- What are the main risks for first-time homebuyers mentioned in these guides?
- Which report mentions inventory changes or supply constraints?

## Technologies

- FastAPI
- LangChain
- ChromaDB
- Hugging Face sentence-transformers
- Groq API
- React
- Vite
- Tailwind CSS
- Axios
- PyMuPDF
- python-dotenv
- python-multipart

## How It Works

### 1. Upload

Users upload PDF files through the website. The backend saves them locally into `docs/uploads/`.

### 2. Ingest

The backend scans the uploaded PDFs and extracts text page by page using PyMuPDF.

### 3. Embed

Each page is split into overlapping chunks, then converted into embeddings using `sentence-transformers/all-MiniLM-L6-v2`, running locally on the backend machine.

### 4. Retrieve

When a user asks a question, the app searches the local ChromaDB vector database for the most semantically relevant chunks.

### 5. Generate

The retrieved chunks are sent to Groq with a strict prompt telling the model to answer only from the provided context and to say when the documents do not contain the answer.

## API Endpoints

- `POST /upload-documents` -> upload one or more PDF files to local storage
- `POST /ask` -> `{ question }` => `{ answer, sources }`
- `POST /ingest` -> triggers ingestion for uploaded PDFs
- `GET /stats` -> returns total documents, chunks, embedding model, and last ingestion time
- `GET /documents` -> returns the uploaded PDF filenames and file sizes
- `GET /health` -> simple health check

## Environment Variables

### Backend

- `GROQ_API_KEY` -> your Groq API key
- `GROQ_MODEL` -> defaults to `llama-3.1-8b-instant`
- `BACKEND_CORS_ORIGINS` -> allowed frontend origin, default `http://localhost:5173`

## Screenshots

Add screenshots here after running the app:

- Upload flow
- Ingestion success state
- Chat answer with sources expanded

## Notes

- Uploaded PDFs are stored locally in `docs/uploads/`.
- Embeddings run locally on the backend and do not require a paid embeddings API.
- The only external key required is `GROQ_API_KEY` for answer generation.
