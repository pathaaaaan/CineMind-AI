# CineMind AI Architecture

```mermaid
flowchart TD
    U[User] --> FE[React Frontend on Vercel]
    FE --> API[FastAPI Backend on Render]
    API --> AUTH[Auth Service]
    API --> MOVIE[Movie Service]
    API --> RAG[RAG Service]
    API --> WATCH[Watchlist Service]
    API --> DASH[Dashboard Service]
    AUTH --> PG[(Neon PostgreSQL)]
    MOVIE --> PG
    WATCH --> PG
    DASH --> PG
    RAG --> PG
    RAG --> EMB[Sentence Transformers]
    RAG --> FAISS[(FAISS Index)]
    RAG --> GEMINI[Gemini 2.5 Flash]
    INGEST[Ingestion Pipeline] --> PG
    INGEST --> EMB
    INGEST --> FAISS
```

The backend follows a router-service-repository layout. Routers handle HTTP contracts, services hold business rules, repositories isolate SQLAlchemy access, and AI/vector modules isolate model providers.

