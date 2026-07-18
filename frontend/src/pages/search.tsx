import { useState } from "react";

import { ragRecommend, semanticSearch } from "../api/rag.api";
import { MovieCard } from "../components/movie-card";
import { RecommendationCard } from "../components/recommendation-card";
import { SearchBox } from "../components/search-box";
import { Button } from "../components/ui/button";
import type { MovieListItem, Recommendation } from "../types/api";

export function SearchPage() {
  const [mode, setMode] = useState<"rag" | "semantic">("rag");
  const [semanticResults, setSemanticResults] = useState<{ movie: MovieListItem; similarity_score: number }[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSearch(query: string) {
    setLoading(true);
    setError("");
    try {
      if (mode === "rag") {
        setRecommendations(await ragRecommend(query));
        setSemanticResults([]);
      } else {
        setSemanticResults(await semanticSearch(query));
        setRecommendations([]);
      }
    } catch {
      setError("Search failed. Check that the backend, database, and FAISS index are running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Semantic discovery</h1>
        <p className="mt-2 text-muted-foreground">Ask for mood, theme, pacing, story structure, or similarity to another movie.</p>
      </div>
      <div className="inline-flex w-fit rounded-md border border-border bg-muted p-1">
        <Button variant={mode === "rag" ? "primary" : "ghost"} onClick={() => setMode("rag")}>RAG</Button>
        <Button variant={mode === "semantic" ? "primary" : "ghost"} onClick={() => setMode("semantic")}>Vector only</Button>
      </div>
      <SearchBox onSearch={runSearch} loading={loading} />
      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-4">
        {recommendations.map((recommendation) => (
          <RecommendationCard key={recommendation.movie.id} recommendation={recommendation} />
        ))}
        {semanticResults.map((result) => (
          <MovieCard key={result.movie.id} movie={result.movie} />
        ))}
      </div>
    </div>
  );
}

