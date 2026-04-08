<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/your_username/real-estate-rag-assistant">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Real Estate RAG Assistant</h3>

  <p align="center">
    A local-first RAG tool that lets you upload real estate PDFs and ask natural language questions — answered with source citations, grounded in your documents.
    <br />
    <a href="https://github.com/your_username/real-estate-rag-assistant"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="./demo-for-project.mp4">View Demo</a>
    &middot;
    <a href="https://github.com/your_username/real-estate-rag-assistant/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/your_username/real-estate-rag-assistant/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#what-is-rag">What Is RAG?</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#how-it-works">How It Works</a></li>
    <li><a href="#api-endpoints">API Endpoints</a></li>
    <li><a href="#example-questions">Example Questions</a></li>
    <li><a href="#free-real-estate-pdf-sources">Free Real Estate PDF Sources</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

> [▶ Watch the demo video](./demo-for-project.mp4)

[![Product Screenshot][product-screenshot]](./demo-for-project.mp4)

Real Estate RAG Assistant is a local-first research tool for analyzing real estate PDFs — market reports, homebuying guides, rental outlooks, and housing data publications. Upload PDFs through the website, ingest them into a local vector database, and ask natural language questions through a React interface that returns grounded answers with source citations.

Embeddings run entirely on your machine and the only external service required is a Groq API key for answer generation.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### What Is RAG?

RAG stands for Retrieval-Augmented Generation. In plain terms:

1. Documents are broken into smaller chunks.
2. Those chunks are converted into embeddings — numerical representations of meaning.
3. When you ask a question, the app finds the most relevant chunks first.
4. The LLM answers using those retrieved chunks instead of guessing.

This makes responses more grounded, more traceable, and much more useful for document-heavy research workflows.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![Python][Python.org]][Python-url]
* [![FastAPI][FastAPI.tiangolo.com]][FastAPI-url]
* [![LangChain][LangChain]][LangChain-url]
* [![ChromaDB][ChromaDB]][ChromaDB-url]
* [![Groq][Groq.com]][Groq-url]
* [![React][React.js]][React-url]
* [![Vite][Vite.dev]][Vite-url]
* [![TailwindCSS][TailwindCSS]][Tailwind-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

* Python 3.8 or later
* Node.js 18 or later
* A [Groq API key](https://console.groq.com)

### Installation

#### Backend

1. Clone the repo
   ```sh
   git clone https://github.com/your_username/real-estate-rag-assistant.git
   cd real-estate-rag-assistant/backend
   ```
2. Create and activate a virtual environment
   ```sh
   python -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies
   ```sh
   pip install -r requirements.txt
   ```
4. Create the environment file and add your credentials
   ```sh
   cp .env.example .env
   ```
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.1-8b-instant
   BACKEND_CORS_ORIGINS=http://localhost:5173
   ```
5. Start the backend
   ```sh
   python -m uvicorn main:app --reload
   ```

#### Frontend

1. Navigate to the frontend directory
   ```sh
   cd ../frontend
   ```
2. Install dependencies
   ```sh
   npm install
   ```
3. Start the dev server
   ```sh
   npm run dev
   ```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:8000`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE -->
## Usage

1. Start the backend and frontend.
2. Open the React app in your browser.
3. Upload one or more PDF files in the sidebar.
4. Review the uploaded files in the list.
5. Click **Ingest Documents** and wait for the success message.
6. Ask questions in the chat panel.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- HOW IT WORKS -->
## How It Works

| Step | What Happens |
|------|-------------|
| **Upload** | PDFs are uploaded through the website and saved locally to `docs/uploads/` |
| **Ingest** | The backend scans uploaded PDFs and extracts text page by page using PyMuPDF |
| **Embed** | Each page is split into overlapping chunks and converted into embeddings using `sentence-transformers/all-MiniLM-L6-v2`, running locally |
| **Retrieve** | When a question is asked, ChromaDB searches for the most semantically relevant chunks |
| **Generate** | Retrieved chunks are sent to Groq with a strict prompt to answer only from the provided context |

> Re-ingestion protection ensures unchanged PDFs are never duplicated in the vector store.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- API ENDPOINTS -->
## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload-documents` | Upload one or more PDF files to local storage |
| `POST` | `/ingest` | Trigger ingestion for uploaded PDFs |
| `POST` | `/ask` | `{ question }` → `{ answer, sources }` |
| `GET` | `/documents` | Return uploaded PDF filenames and file sizes |
| `GET` | `/stats` | Return total documents, chunks, embedding model, and last ingestion time |
| `GET` | `/health` | Simple health check |

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- EXAMPLE QUESTIONS -->
## Example Questions

* What does the rental report say about year-over-year rent growth?
* Which document discusses home affordability constraints?
* Summarize the latest housing price trends from the FHFA documents.
* What are the main risks for first-time homebuyers mentioned in these guides?
* Which report mentions inventory changes or supply constraints?

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- FREE PDF SOURCES -->
## Free Real Estate PDF Sources

| Source | URL |
|--------|-----|
| Zillow Research | https://www.zillow.com/research/ |
| National Association of Realtors (NAR) | https://www.nar.realtor/research-and-statistics |
| HUD | https://www.hud.gov/ |
| FHFA | https://www.fhfa.gov/ |

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- PROJECT STRUCTURE -->
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

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [x] PDF upload and local storage
- [x] Local embeddings with sentence-transformers
- [x] ChromaDB vector store with re-ingestion protection
- [x] Groq-powered answer generation
- [x] Source-aware answers with filename, page number, and chunk preview
- [x] FastAPI backend and React + Vite frontend
- [ ] Multi-collection support to separate document sets
- [ ] Conversational memory for follow-up questions
- [ ] Support for additional file types (DOCX, CSV)
- [ ] Authentication and per-user document isolation

See the [open issues](https://github.com/your_username/real-estate-rag-assistant/issues) for a full list of proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also open an issue with the tag `enhancement`. Don't forget to give the project a star!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Your Name — [@your_twitter](https://twitter.com/your_username) — email@example.com

Project Link: [https://github.com/your_username/real-estate-rag-assistant](https://github.com/your_username/real-estate-rag-assistant)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [LangChain](https://github.com/langchain-ai/langchain)
* [ChromaDB](https://www.trychroma.com)
* [Groq](https://groq.com)
* [Hugging Face sentence-transformers](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
* [PyMuPDF](https://pymupdf.readthedocs.io)
* [Choose an Open Source License](https://choosealicense.com)
* [Img Shields](https://shields.io)
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/your_username/real-estate-rag-assistant.svg?style=for-the-badge
[contributors-url]: https://github.com/your_username/real-estate-rag-assistant/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/your_username/real-estate-rag-assistant.svg?style=for-the-badge
[forks-url]: https://github.com/your_username/real-estate-rag-assistant/network/members
[stars-shield]: https://img.shields.io/github/stars/your_username/real-estate-rag-assistant.svg?style=for-the-badge
[stars-url]: https://github.com/your_username/real-estate-rag-assistant/stargazers
[issues-shield]: https://img.shields.io/github/issues/your_username/real-estate-rag-assistant.svg?style=for-the-badge
[issues-url]: https://github.com/your_username/real-estate-rag-assistant/issues
[license-shield]: https://img.shields.io/github/license/your_username/real-estate-rag-assistant.svg?style=for-the-badge
[license-url]: https://github.com/your_username/real-estate-rag-assistant/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/your_username
[product-screenshot]: images/screenshot.png
[Python.org]: https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white
[Python-url]: https://python.org
[FastAPI.tiangolo.com]: https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white
[FastAPI-url]: https://fastapi.tiangolo.com
[LangChain]: https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white
[LangChain-url]: https://github.com/langchain-ai/langchain
[ChromaDB]: https://img.shields.io/badge/ChromaDB-E85D4A?style=for-the-badge&logoColor=white
[ChromaDB-url]: https://www.trychroma.com
[Groq.com]: https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logoColor=white
[Groq-url]: https://groq.com
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Vite.dev]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vitejs.dev
[TailwindCSS]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com
