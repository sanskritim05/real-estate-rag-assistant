<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h3 align="center">Real Estate RAG Assistant</h3>

  <p align="center">
    Upload real estate PDFs, ingest them in your browser, and ask grounded questions with source citations. The whole app deploys on Vercel.
  </p>
</div>



<!-- ABOUT THE PROJECT -->
## About The Project

Real Estate RAG Assistant helps users explore housing and market documents through a chat interface. Users upload PDF reports, ingest them in the current browser session, and ask natural language questions.

The app retrieves the most relevant passages from those PDFs, sends them to Groq, and returns a concise answer with source citations. Files live in the tab until you refresh — that is what makes a single Vercel Hobby deploy possible without a database.

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

* Node.js 18 or later
* A [Groq API key](https://console.groq.com)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/sanskritim05/real-estate-rag-assistant
   cd real-estate-rag-assistant
   ```
2. Set up the app
   ```sh
   cd frontend
   npm install
   cp .env.example .env
   ```
3. Add your Groq key to `frontend/.env`
   ```sh
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=llama-3.1-8b-instant
   ```
   This key is only used by the local `/api/ask` server. It is not exposed to the browser.
4. Start the app
   ```sh
   npm run dev
   ```
5. Open in your browser
   ```text
   http://localhost:5173
   ```

<!-- DEPLOY -->
## Deploy on Vercel

The full app runs on **Vercel Hobby** (GitHub login, no credit card). PDFs stay in the visitor's browser for that tab session.

1. Push this repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new). `vercel.json` builds `frontend/` and hosts `/api/ask`.
3. Add these environment variables, then deploy:
   ```text
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=llama-3.1-8b-instant
   ```
4. Open the Vercel URL, upload PDFs, ingest, and ask.

Refreshing the page clears uploaded files. That is expected.

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
├── api/                     Vercel function
│   ├── ask.js               Groq answer endpoint
│   └── ask-handler.js       shared Groq logic
├── frontend/                UI (Vite + React)
│   ├── public/favicon.svg
│   └── src/
│       ├── components/      sidebar, chat, sources
│       ├── lib/             PDF ingest, retrieval, API client
│       ├── App.tsx
│       └── styles.css
├── backend/                 optional original FastAPI app (not used on Vercel)
├── vercel.json
├── demo-for-project.mp4
└── README.md
```

## How It Works

1. Upload: PDFs stay in this browser tab.
2. Ingest: the browser extracts text and splits it into chunks.
3. Ask: the most relevant chunks are sent to `/api/ask`.
4. Generate: Groq answers using only that context.

## API

* `POST /api/ask` -> `{ question, chunks }` returns `{ answer, sources }`

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
