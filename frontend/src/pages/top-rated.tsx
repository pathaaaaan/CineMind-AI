import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Grid, HelpCircle, Info, List as ListIcon, Loader2, Search, SlidersHorizontal, Star, TrendingUp } from "lucide-react";
import { getTopRatedTV, type TopRatedTVShow } from "../api/tmdb.api";

const TV_GENRES = [
  "Action & Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Kids",
  "Mystery",
  "Sci-Fi & Fantasy",
  "Western"
];

export function TopRatedPage() {
  const [shows, setShows] = useState<TopRatedTVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Filters
  const [selectedGenre, setSelectedGenre] = useState("");
  const [sortBy, setSortBy] = useState("score_desc");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    getTopRatedTV({
      genre: selectedGenre || undefined,
      sort_by: sortBy
    })
      .then(setShows)
      .catch((err: any) => console.error("Error loading top-rated shows:", err))
      .finally(() => setLoading(false));
  }, [selectedGenre, sortBy]);

  // Client-side search filter
  const filteredShows = shows.filter((show) =>
    show.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    show.original_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 py-6 pb-20">
      {/* Page Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          CineMind Top 250 TV Shows
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Ranked using a custom scoring algorithm. Minimum TV Show 1,000 votes required. Last updated: July 12, 2026.
        </p>
      </div>

      {/* Explanatory Info Card (Collapsible) */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-zinc-200">
            <HelpCircle size={18} className="text-red-500" />
            <h3 className="font-semibold text-sm sm:text-base">How the score is calculated</h3>
          </div>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
          >
            {showExplanation ? "Hide Details" : "Show Details"}
          </button>
        </div>

        {showExplanation && (
          <div className="mt-4 border-t border-zinc-900 pt-4 text-xs sm:text-sm text-zinc-400 space-y-4 leading-relaxed">
            <p>
              The Top 250 list highlights shows that are both consistently well-rated and backed by strong audience participation. The scoring system blends episode quality with how reliable the show's overall rating is.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-zinc-900/50 p-3.5 border border-zinc-900">
                <h4 className="font-semibold text-white mb-1.5">1. Episode Score (40%)</h4>
                <p className="text-xs text-zinc-400">
                  This measures the overall strength of a show's episodes. It calculates the average rating across all episodes. A correction is applied so short shows don't get an unfair advantage.
                </p>
              </div>
              <div className="rounded-lg bg-zinc-900/50 p-3.5 border border-zinc-900">
                <h4 className="font-semibold text-white mb-1.5">2. Show Score (60%)</h4>
                <p className="text-xs text-zinc-400">
                  This adjusts the show's rating based on how many votes it has. Shows with high vote counts have ratings that can be trusted more. Shows with fewer votes get pulled toward a global average (7.5).
                </p>
              </div>
              <div className="rounded-lg bg-zinc-900/50 p-3.5 border border-zinc-900">
                <h4 className="font-semibold text-white mb-1.5">3. Final Score</h4>
                <p className="text-xs text-zinc-400">
                  The final ranking is calculated as: <code className="text-red-400 bg-zinc-950 px-1 py-0.5 rounded font-mono">0.40 × Episode Score + 0.60 × Show Score</code>. This favors shows with both strong episodes and high engagement.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Control Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-y border-zinc-900 py-4">
        {/* Left Side: Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Genre select */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Genre</span>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-red-500/50 transition cursor-pointer"
            >
              <option value="">All Genres</option>
              {TV_GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Sort By Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-red-500/50 transition cursor-pointer"
            >
              <option value="score_desc">Bayesian Score (High)</option>
              <option value="score_asc">Bayesian Score (Low)</option>
              <option value="rating_desc">Overall Rating</option>
              <option value="year_desc">Year (Newest)</option>
              <option value="year_asc">Year (Oldest)</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input
              type="text"
              placeholder="Filter by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 pl-8 pr-4 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-red-500/50 transition"
            />
          </div>
        </div>

        {/* Right Side: View Toggle (Grid / List) */}
        <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded transition ${viewMode === "list" ? "bg-zinc-800 text-red-500" : "text-zinc-500 hover:text-zinc-300"}`}
            title="List View"
          >
            <ListIcon size={16} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded transition ${viewMode === "grid" ? "bg-zinc-800 text-red-500" : "text-zinc-500 hover:text-zinc-300"}`}
            title="Grid View"
          >
            <Grid size={16} />
          </button>
        </div>
      </div>

      {/* Shows Listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
          <Loader2 size={32} className="animate-spin text-red-500" />
          <p className="text-sm">Calculating Top 250 ratings...</p>
        </div>
      ) : filteredShows.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-sm">No shows matching the filters were found.</p>
        </div>
      ) : viewMode === "list" ? (
        /* LIST VIEW */
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 shadow-md">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 font-medium">
                <th className="px-4 py-3.5 w-12 text-center">Rank</th>
                <th className="px-4 py-3.5">Show</th>
                <th className="px-4 py-3.5 text-center w-24">Year</th>
                <th className="px-4 py-3.5 text-center w-24">Rating</th>
                <th className="px-4 py-3.5 text-center w-28">Bayesian Score</th>
                <th className="px-4 py-3.5 text-center w-24">Episodes</th>
                <th className="px-4 py-3.5 hidden md:table-cell">Genres</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredShows.map((show) => (
                <tr key={show.id} className="hover:bg-zinc-900/30 transition-all group">
                  <td className="px-4 py-3.5 text-center font-extrabold text-zinc-500 group-hover:text-red-500 transition">
                    #{show.rank}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-white">
                    <Link to={`/show/tv/${show.id}`} className="flex items-center gap-3.5 hover:text-red-400 transition">
                      <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-zinc-900 border border-zinc-800 shadow">
                        {show.poster_url ? (
                          <img src={show.poster_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-zinc-700">
                            {show.title.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-white group-hover:text-red-400 transition truncate">
                          {show.title}
                        </span>
                        <span className="block text-[11px] text-zinc-500 truncate mt-0.5 max-w-[250px] sm:max-w-md hidden sm:block">
                          {show.overview || "No description available."}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-center text-zinc-400 font-mono">
                    {show.year}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center gap-1 rounded bg-yellow-500/10 px-2 py-0.5 text-xs font-bold text-yellow-500 border border-yellow-500/20">
                      <Star size={11} fill="currentColor" />
                      <span>{show.vote_average.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-red-400 font-mono">
                    {show.custom_score.toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5 text-center text-zinc-400 text-xs">
                    {show.episode_count} eps
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {show.genres.slice(0, 2).map((g: string) => (
                        <span key={g} className="rounded-sm bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                          {g}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {filteredShows.map((show) => (
            <Link
              key={show.id}
              to={`/show/tv/${show.id}`}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950 transition hover:border-zinc-800 hover:-translate-y-1"
            >
              {/* Poster Grid Block */}
              <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                {show.poster_url ? (
                  <img
                    src={show.poster_url}
                    alt={show.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-700">
                    {show.title.slice(0, 2)}
                  </div>
                )}

                {/* Overlay: Rank Badge */}
                <div className="absolute top-2.5 left-2.5 rounded-md bg-black/80 px-2.5 py-1 text-xs font-black text-white border border-zinc-800">
                  #{show.rank}
                </div>

                {/* Overlay: Rating Badge */}
                <div className="absolute top-2.5 right-2.5 rounded-md bg-black/80 px-2 py-1 text-xs font-bold text-yellow-500 border border-zinc-800">
                  ★ {show.vote_average.toFixed(1)}
                </div>

                {/* Overlay: Score Indicator */}
                <div className="absolute bottom-2.5 right-2.5 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                  Score: {show.custom_score.toFixed(2)}
                </div>
              </div>

              {/* Text Info */}
              <div className="p-3.5 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-red-400 transition">
                    {show.title}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-500">
                    <span>{show.year}</span>
                    <span>•</span>
                    <span>{show.episode_count} eps</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {show.genres.slice(0, 1).map((g: string) => (
                    <span key={g} className="rounded-sm bg-zinc-900 border border-zinc-800/60 px-1.5 py-0.5 text-[9px] text-zinc-500">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
