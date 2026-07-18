import { api } from "./axios";
import type { Movie, MovieListItem } from "../types/api";

export async function searchMovies(query: string) {
  const { data } = await api.get<{ items: MovieListItem[] }>("/movies/search", { params: { query } });
  return data.items;
}

export async function getMovie(id: string) {
  const { data } = await api.get<Movie>(`/movies/${id}`);
  return data;
}

export async function getSimilarMovies(id: string) {
  const { data } = await api.get<{ recommendations: { movie: MovieListItem; similarity_score: number }[] }>(`/movies/${id}/similar`);
  return data.recommendations;
}

