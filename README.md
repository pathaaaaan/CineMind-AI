# CineMind AI 🎬🤖

CineMind AI is a production-grade, RAG-powered semantic movie discovery platform. Users can describe the kind of film they want in natural language, CineMind retrieves the most relevant movies using Sentence Transformers + FAISS vector search, and Gemini generates grounded, context-aware explanations of why those movies match the user's query.

> [!WARNING]  
> **Security Key Rotation:** Keep all TMDB and Gemini API keys in environment variables only. If an API key is ever committed or shared in chat, rotate it immediately before deploying to production.

---

## 🏗️ Architecture

CineMind AI follows a clean, decoupled client-server architecture:

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

The FastAPI backend uses a modular **Router-Service-Repository** pattern:
- **Routers**: Define API contracts and input validation (Pydantic v2).
- **Services**: Implement business logic, orchestration, and AI pipeline queries.
- **Repositories**: Standardize database access using SQLAlchemy 2.
- **AI/Vector Store Modules**: Abstract model providers, vector indexing, and embedding computation.

---

## 📂 Project Structure

```text
├── backend/            # FastAPI API, RAG logic, index ingestion pipelines, database schemas, and unit tests
├── frontend/           # React 19 single-page app (TypeScript, Tailwind CSS, Framer Motion)
├── data/               # Raw datasets, processed exports, and FAISS index sidecar files
└── docs/               # Architecture, RAG pipelines, and API design specifications
```

---

## ⚙️ Configuration & Environment Variables

### Backend Configuration

Create a `backend/.env` file with the following variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `APP_NAME` | `CineMind AI` | The name of the API service |
| `ENVIRONMENT` | `development` | Environment mode (`development` or `production`) |
| `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@localhost:5432/cinemind` | PostgreSQL connection URI |
| `JWT_SECRET_KEY` | `change-me` | Secret key used to sign JWT session tokens |
| `JWT_ALGORITHM` | `HS256` | Encryption algorithm for auth tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Duration of authentication sessions |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin for the React app |
| `GEMINI_API_KEY` | *(Required)* | Google Gemini API key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | LLM model used for summary generation |
| `TMDB_API_KEY` | *(Required)* | The Movie Database (TMDB) v3 API key |
| `FAISS_INDEX_PATH` | `../data/faiss/movies.index` | Path to the built vector index |
| `FAISS_METADATA_PATH` | `../data/faiss/movie_metadata.json` | Path to index-to-database mappings |

### Frontend Configuration

Create a `frontend/.env` file:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Target backend REST API URL |

---

## 🚀 Quick Start

### 1. Setup Backend

Navigate to the `backend` directory, set up a Python virtual environment, install dependencies, and run:

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Make sure to edit .env and provide your GEMINI_API_KEY and TMDB_API_KEY

# Run database migrations / seed database (if applicable) and start the backend
uvicorn app.main:app --reload
```

*The API will be available at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.*

### 2. Setup Frontend

Navigate to the `frontend` directory, install packages, and spin up the Vite development server:

```bash
cd frontend

# Install Node packages
npm install

# Configure environment variables
cp .env.example .env

# Run Vite dev server
npm run dev
```

*Open `http://localhost:5173` in your browser to access the app.*

---

## 🧪 Testing

To run the backend test suite:

```bash
cd backend
source .venv/bin/activate
pytest
```

---

To run the frontend build:

```bash
cd frontend
npm ci
npm run build
```

The repository includes a sanitized `backend/.env.example`. Copy it to
`backend/.env`, replace all placeholders with local values, and never commit or
share the real environment file. Credentials previously present in the
example file must be rotated before production use. Production startup rejects
the insecure default JWT secret and local SQLite configuration.

## 🔍 Semantic Search & RAG Flow

1. **Document Embedding**: Movies are represented as semantic documents containing concatenated attributes (title, tagline, overview, genres, directors, cast, and cleaned notebook keywords).
2. **Indexing**: Embeddings are computed via `all-MiniLM-L6-v2` and cached using a FAISS `IndexFlatIP` vector index. PostgreSQL acts as the source of truth for movie metadata.
3. **Retrieval**: User queries are embedded on the fly, and FAISS returns the closest `top_k` matches.
4. **PostgreSQL Hydration**: Source-of-truth metadata is loaded for the matches from PostgreSQL.
5. **Grounded Generation**: Gemini receives the query and the exact candidate movies. The LLM is instructed *never* to hallucinate outside the retrieved context. Pydantic validates the response format before returning.

---

## 🔌 API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Create a new user profile
- `POST /api/auth/login` - Authenticate and get a JWT token
- `GET /api/auth/me` - Fetch authenticated user details

### Movies
- `GET /api/movies/search` - Text search with query parameters (`query`, `page`, `limit`)
- `GET /api/movies/{movie_id}` - Retrieve metadata of a specific movie
- `GET /api/movies/{movie_id}/similar` - Retrieve similar movies based on vector distance

### RAG Operations
- `POST /api/rag/search` - Retrieve grounded movie recommendation responses via natural language query
- `POST /api/rag/recommend` - Personalized movie recommendations based on user history and preferences

### Watchlist
- `GET /api/watchlist` - Fetch user's watchlisted movies
- `POST /api/watchlist/add` - Add movie to watchlist
- `DELETE /api/watchlist/{movie_id}` - Remove movie from watchlist

### Dashboard
- `GET /api/dashboard/summary` - Fetch dashboard statistics (e.g. watch count, genre preferences)
- `GET /api/dashboard/history` - Retrieve user search/recommendation logs
