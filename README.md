# CineMind AI

CineMind AI is a production-style RAG-powered semantic movie discovery platform. Users describe the kind of film they want in natural language, CineMind retrieves relevant movies with Sentence Transformers + FAISS, then Gemini generates grounded explanations from the retrieved context.

> Important: keep TMDB and Gemini keys in environment variables only. If a key has ever been pasted into chat or committed, rotate it before deployment.

## Stack

- Frontend: React 19, TypeScript, Tailwind CSS, Shadcn-style components, Framer Motion, Axios, React Router
- Backend: FastAPI, Pydantic v2, SQLAlchemy 2, PostgreSQL, JWT, bcrypt
- AI: Sentence Transformers `all-MiniLM-L6-v2`, FAISS, Gemini 2.5 Flash
- Deployment: Vercel, Render, Neon PostgreSQL, persisted FAISS index

## Structure

```text
backend/    FastAPI API, RAG pipeline, ingestion, vector store
frontend/   React application
data/       raw datasets, processed exports, FAISS index files
docs/       architecture and API notes
```

## Backend Quick Start

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Frontend Quick Start

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## RAG Flow

```text
User query
-> MiniLM query embedding
-> FAISS vector retrieval
-> PostgreSQL movie hydration
-> optional filters
-> Gemini grounded explanation
-> validated API response
```

Gemini is not allowed to invent recommendations. It only explains movies retrieved by FAISS.

