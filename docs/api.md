# API Overview

Base path: `/api`

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

## Movies

- `GET /movies/search?query=&page=&limit=`
- `GET /movies/{movie_id}`
- `GET /movies/{movie_id}/similar?top_k=`

## RAG

- `POST /rag/search`
- `POST /rag/recommend`

## Watchlist

- `POST /watchlist/add`
- `GET /watchlist`
- `DELETE /watchlist/{movie_id}`

## Dashboard

- `GET /dashboard/summary`
- `GET /dashboard/history`

