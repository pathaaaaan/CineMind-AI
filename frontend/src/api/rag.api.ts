import { api } from "./axios";
import type { MovieListItem, Recommendation } from "../types/api";

export async function semanticSearch(query: string) {
  const { data } = await api.post<{ results: { movie: MovieListItem; similarity_score: number }[] }>("/rag/search", { query, top_k: 10 });
  return data.results;
}

export async function ragRecommend(query: string) {
  const { data } = await api.post<{ recommendations: Recommendation[] }>("/rag/recommend", { query, top_k: 8 });
  return data.recommendations;
}

