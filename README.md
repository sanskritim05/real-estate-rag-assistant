<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h3 align="center">Real Estate RAG Assistant</h3>

  <p align="center">
    A local-first research app that lets users upload real estate PDFs, ingest them into ChromaDB, and ask grounded questions with source citations.
  </p>
</div>

## Demo
https://github.com/user-attachments/assets/939d6f74-de6a-4216-bea0-16931297d938



<!-- ABOUT THE PROJECT -->
## About The Project

Real Estate RAG Assistant helps users explore housing and market documents through a clean chat interface. Users upload PDF reports, homebuying guides, and market analyses directly in the app, ingest them into a local vector database, and then ask natural language questions.

The app retrieves the most relevant document chunks, sends them to Groq for answer generation, and returns a concise response with supporting source citations. It is designed to run locally, with free local embeddings and persistent ChromaDB storage.

### Built With

* [![Python][Python.org]][Python-url]
* [![FastAPI][FastAPI.tiangolo.com]][FastAPI-url]
* [![React][React.dev]][React-url]
* [![Vite][Vite.dev]][Vite-url]
* [![LangChain][LangChain]][LangChain-url]
* [![Groq][Groq.com]][Groq-url]
* [![ChromaDB][ChromaDB]][ChromaDB-url]
* [![Tailwind CSS][TailwindCSS.com]][TailwindCSS-url]

<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

* Python 3.10 or later
* Node.js 18 or later
* A [Groq API key](https://console.groq.com)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/sanskritim05/real-estate-rag-assistant
   cd real-estate-rag-assistant
   ```
2. Set up the backend
   ```sh
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   ```
3. Add your Groq credentials to `backend/.env`
   ```sh
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=llama-3.1-8b-instant
   BACKEND_CORS_ORIGINS=http://localhost:5173
   ```
4. Start the backend
   ```sh
   python -m uvicorn main:app --reload
   ```
5. In a new terminal, set up the frontend
   ```sh
   cd frontend
   npm install
   npm run dev
   ```
6. Open in your browser
   ```text
   http://localhost:5173
   ```

<!-- DEPLOY -->
## Deploy

Use **Render for the API** and **Vercel for the UI**. Deploy Render first so you have an API URL to give Vercel.

### 1. Render (backend)

The API writes PDFs and ChromaDB to disk, so it needs a [persistent disk](https://render.com/docs/disks) (Starter plan or higher).

1. Push this repo to GitHub.
2. In [Render](https://dashboard.render.com), create a **Blueprint** from the repo. It will read `render.yaml`.
   Or create a **Web Service** manually:
   - Root directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Instance: Starter (or larger if ingest runs out of memory)
3. Add a 1 GB disk mounted at `/var/data`.
4. Set environment variables:
   ```text
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=llama-3.1-8b-instant
   DATA_DIR=/var/data
   BACKEND_CORS_ORIGINS=https://your-app.vercel.app
   BACKEND_CORS_ORIGIN_REGEX=https://.*\.vercel\.app
   ```
   If you do not have the Vercel URL yet, add it after the frontend deploy and restart the service.
5. Copy the Render URL, for example `https://real-estate-rag-api.onrender.com`.
6. Open `/health` on that URL and confirm it returns `{"status":"ok"}`. The first boot can take a few minutes while the embedding model downloads.

### 2. Vercel (frontend)

1. Import the same GitHub repo in [Vercel](https://vercel.com/new). `vercel.json` already builds `frontend/`.
2. Add this **Production** environment variable:
   ```text
   VITE_API_BASE_URL=https://real-estate-rag-api.onrender.com
   ```
   Use your real Render URL. No trailing slash.
3. Deploy. Copy the Vercel URL (for example `https://your-app.vercel.app`).
4. Go back to Render and set `BACKEND_CORS_ORIGINS` to that Vercel URL, then restart the API.
5. Redeploy Vercel if you change `VITE_API_BASE_URL`. Vite inlines it at **build** time.

Local development is unchanged: backend on port 8000, frontend on 5173.

<!-- USAGE -->
## Usage

1. Open the app in your browser.
2. Upload one or more PDF files in the sidebar.
3. Click `Ingest Documents`.
4. Wait for the ingestion success message.
5. Ask questions in the chat panel.
6. Review the grounded answer and expand `Show Sources` when needed.

<!-- EXAMPLE QUESTIONS -->
## Example Questions

* What does the rental report say about year-over-year rent growth?
* Which document discusses home affordability constraints?
* Summarize the latest housing price trends from the FHFA documents.
* What are the main risks for first-time homebuyers mentioned in these guides?
* Which report mentions inventory changes or supply constraints?

## Free Real Estate PDF Sources

* [Zillow Research](https://www.zillow.com/research/)
* [National Association of Realtors (NAR)](https://www.nar.realtor/research-and-statistics)
* [HUD](https://www.hud.gov/)
* [FHFA](https://www.fhfa.gov/)

<!-- PROJECT STRUCTURE -->
## Project Structure

```text
real-estate-rag-assistant/
├── backend/                 API (FastAPI)
│   ├── main.py              routes
│   ├── ingest.py            PDF upload + chunking + embeddings
│   ├── retriever.py         ChromaDB search
│   ├── rag_chain.py         Groq answer generation
│   ├── data/                runtime files (not committed)
│   │   ├── uploads/         user PDFs
│   │   └── chroma/          vector store
│   ├── .env.example
│   ├── requirements.txt
│   └── runtime.txt
├── frontend/                UI (Vite + React)
│   ├── public/favicon.svg
│   └── src/
│       ├── components/      sidebar, chat, sources
│       ├── lib/api.ts       backend client
│       ├── App.tsx
│       └── styles.css
├── vercel.json              Vercel → frontend
├── render.yaml              Render → backend
├── demo-for-project.mp4
└── README.md
```

## How It Works

1. Upload: users upload PDFs directly through the app.
2. Ingest: the backend parses the uploaded PDFs with PyMuPDF.
3. Embed: the text is chunked and embedded locally with `sentence-transformers/all-MiniLM-L6-v2`.
4. Retrieve: relevant chunks are pulled from ChromaDB.
5. Generate: Groq answers using only the retrieved context.

## API Endpoints

* `POST /upload-documents` -> upload one or more PDF files
* `POST /ask` -> ask a question and receive `{ answer, sources }`
* `POST /ingest` -> ingest uploaded PDFs into ChromaDB
* `GET /documents` -> list uploaded PDFs
* `GET /stats` -> return document and chunk counts
* `GET /health` -> health check

<!-- MARKDOWN LINKS & IMAGES -->
[Python.org]: https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white
[Python-url]: https://python.org
[FastAPI.tiangolo.com]: https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white
[FastAPI-url]: https://fastapi.tiangolo.com
[React.dev]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev
[Vite.dev]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vite.dev
[LangChain]: https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white
[LangChain-url]: https://www.langchain.com/
[Groq.com]: https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logoColor=white
[Groq-url]: https://groq.com
[ChromaDB]: https://img.shields.io/badge/ChromaDB-E85D4A?style=for-the-badge&logoColor=white
[ChromaDB-url]: https://www.trychroma.com
[TailwindCSS.com]: https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
[TailwindCSS-url]: https://tailwindcss.com
