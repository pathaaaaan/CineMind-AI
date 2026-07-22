import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, Film, Star, Tv } from "lucide-react";

import { ragRecommend, semanticSearch } from "../api/rag.api";
import { searchMulti, type TmdbSearchResult } from "../api/tmdb.api";
import { MovieCard } from "../components/movie-card";
import { RecommendationCard } from "../components/recommendation-card";
import { SearchBox } from "../components/search-box";
import { Button } from "../components/ui/button";
import type { MovieListItem, Recommendation } from "../types/api";

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [mode, setMode] = useState<"global" | "rag" | "semantic">("global");
  const [globalResults, setGlobalResults] = useState<TmdbSearchResult[]>([]);
  const [semanticResults, setSemanticResults] = useState<{ movie: MovieListItem; similarity_score: number }[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSearch(query: string) {
    if (!query.trim()) return;
    setSearchParams({ q: query });
  }

  // Auto-run search if 'q' is present in URL query params on load or change
  useEffect(() => {
    if (!queryParam.trim()) {
      setGlobalResults([]);
      setRecommendations([]);
      setSemanticResults([]);
      return;
    }

    const executeSearch = async () => {
      setLoading(true);
      setError("");
      try {
        if (mode === "global") {
          const results = await searchMulti(queryParam);
          setGlobalResults(results);
          setRecommendations([]);
          setSemanticResults([]);
        } else if (mode === "rag") {
          setRecommendations(await ragRecommend(queryParam));
          setSemanticResults([]);
          setGlobalResults([]);
        } else {
          setSemanticResults(await semanticSearch(queryParam));
          setRecommendations([]);
          setGlobalResults([]);
        }
      } catch {
        setError("Search failed. Check that the backend, database, and FAISS index are running.");
      } finally {
        setLoading(false);
      }
    };

    executeSearch();
  }, [queryParam, mode]);

  return (
    <div className="grid gap-5 py-6 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Search & Discovery</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Find any TV show, movie, or anime globally, or use our AI assistant for local database semantic recommendations.
        </p>
      </div>

      {/* Mode Switches */}
      <div className="inline-flex w-fit rounded-lg border border-zinc-800 bg-zinc-950 p-1">
        <Button
          variant={mode === "global" ? "primary" : "ghost"}
          onClick={() => setMode("global")}
          className="text-xs"
        >
          Global Database (All Shows/Movies)
        </Button>
        <Button
          variant={mode === "rag" ? "primary" : "ghost"}
          onClick={() => setMode("rag")}
          className="text-xs"
        >
          AI RAG recommendation (Local DB)
        </Button>
        <Button
          variant={mode === "semantic" ? "primary" : "ghost"}
          onClick={() => setMode("semantic")}
          className="text-xs"
        >
          Semantic Vector Search (Local DB)
        </Button>
      </div>

      <SearchBox onSearch={runSearch} loading={loading} />

      {error ? (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs sm:text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {/* Results Listings */}
      <div className="grid gap-6">
        {/* Render Global TMDB Search Results */}
        {mode === "global" && globalResults.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {globalResults.map((item) => (
              <Link
                key={item.id}
                to={`/show/${item.media_type}/${item.id}`}
                className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 hover:bg-zinc-900 transition hover:border-zinc-700 group"
              >
                {/* Poster */}
                <div className="w-16 sm:w-20 aspect-[2/3] shrink-0 rounded overflow-hidden bg-zinc-900 border border-zinc-800 shadow">
                  {item.poster_url ? (
                    <img src={item.poster_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold text-zinc-700 text-xs">
                      {item.title.slice(0, 2)}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-grow min-w-0 space-y-1.5 flex flex-col justify-center">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded bg-zinc-800/80 px-2 py-0.5 text-[9px] font-bold uppercase text-zinc-400 border border-zinc-700">
                      {item.media_type === "tv" ? <Tv size={9} /> : <Film size={9} />}
                      {item.media_type === "tv" ? "TV Series" : "Movie"}
                    </span>
                    {item.release_date && (
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                        <Calendar size={11} />
                        {item.release_date.split("-")[0]}
                      </span>
                    )}
                    {item.vote_average > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500 border border-yellow-500/20">
                        ★ {item.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-red-400 transition truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-light">
                    {item.overview || "No details available."}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Render Local DB AI Search Results */}
        {mode === "rag" && recommendations.map((rec) => (
          <RecommendationCard key={rec.movie.id} recommendation={rec} />
        ))}

        {mode === "semantic" && semanticResults.map((res) => (
          <MovieCard key={res.movie.id} movie={res.movie} />
        ))}

        {!loading &&
          ((mode === "global" && globalResults.length === 0) ||
            (mode === "rag" && recommendations.length === 0) ||
            (mode === "semantic" && semanticResults.length === 0)) && (
            <div className="text-center py-20 text-zinc-500 text-xs">
              No results found. Try typing a query above.
            </div>
          )}
      </div>
    </div>
  );
}
