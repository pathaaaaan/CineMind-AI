import { api } from "./axios";
import type { MovieListItem } from "../types/api";

export async function addToWatchlist(movieId: string, status = "saved") {
  const { data } = await api.post("/watchlist/add", { movie_id: movieId, status });
  return data;
}

export async function addTmdbToWatchlist(tmdbId: number, mediaType: "movie" | "tv", status = "saved") {
  const { data } = await api.post("/watchlist/add_tmdb", { tmdb_id: tmdbId, media_type: mediaType, status });
  return data;
}

export async function getWatchlist() {
  const { data } = await api.get<{ items: { id: string; status: string; movie: MovieListItem; created_at: string }[] }>("/watchlist");
  return data.items;
}

export async function removeFromWatchlist(movieId: string) {
  const { data } = await api.delete(`/watchlist/${movieId}`);
  return data;
}

