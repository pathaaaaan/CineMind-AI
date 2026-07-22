import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Award, Calendar, Clock, Heart, HelpCircle, Info, Loader2, Star, TrendingUp } from "lucide-react";
import { getMovieDetails, getSimilarItems, getTvDetails, getTvEpisodes, type Episode, type MovieDetails, type SimilarItem, type TvDetails, type TvEpisodesData } from "../api/tmdb.api";
import { addTmdbToWatchlist } from "../api/watchlist.api";

interface ShowDetailPageProps {
  defaultType?: "movie" | "tv";
}

export function ShowDetailPage({ defaultType }: ShowDetailPageProps) {
  const { type: pathType, id } = useParams();
  const type = pathType || defaultType || "movie";

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [tvShow, setTvShow] = useState<TvDetails | null>(null);
  const [episodesData, setEpisodesData] = useState<TvEpisodesData | null>(null);
  const [similar, setSimilar] = useState<SimilarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"graph" | "heatmap" | "episodes">("graph");
  const [watchlistSuccess, setWatchlistSuccess] = useState("");
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [graphTooltip, setGraphTooltip] = useState<{ ep: Episode; x: number; y: number } | null>(null);

  // Accordion state for seasons list
  const [expandedSeason, setExpandedSeason] = useState<number | null>(1);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setWatchlistSuccess("");
    setActiveEpisode(null);
    setGraphTooltip(null);

    const loadData = async () => {
      try {
        if (type === "movie") {
          const [mDetails, sim] = await Promise.all([
            getMovieDetails(id),
            getSimilarItems("movie", id)
          ]);
          setMovie(mDetails);
          setSimilar(sim);
        } else {
          const [tvDetails, epData, sim] = await Promise.all([
            getTvDetails(id),
            getTvEpisodes(id),
            getSimilarItems("tv", id)
          ]);
          setTvShow(tvDetails);
          setEpisodesData(epData);
          if (epData.stats.highest) {
            setActiveEpisode(epData.stats.highest);
          }
          setSimilar(sim);
        }
      } catch (err) {
        console.error("Failed to load show details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [type, id]);

  const handleWatchlist = async () => {
    if (!id) return;
    try {
      await addTmdbToWatchlist(parseInt(id), type as "movie" | "tv", "favorite");
      setWatchlistSuccess("Added to watchlist!");
      setTimeout(() => setWatchlistSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setWatchlistSuccess("Failed to watchlist.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-zinc-500 gap-3">
        <Loader2 size={32} className="animate-spin text-red-500" />
        <p className="text-sm">Fetching show profile...</p>
      </div>
    );
  }

  const showTitle = type === "movie" ? movie?.title : tvShow?.title;
  const showBackdrop = type === "movie" ? movie?.backdrop_url : tvShow?.backdrop_url;
  const showPoster = type === "movie" ? movie?.poster_url : tvShow?.poster_url;
  const showTagline = type === "movie" ? movie?.tagline : tvShow?.tagline;
  const showOverview = type === "movie" ? movie?.overview : tvShow?.overview;
  const showRating = type === "movie" ? movie?.vote_average : tvShow?.vote_average;
  const showGenres = type === "movie" ? movie?.genres : tvShow?.genres;
  const showRelease = type === "movie" ? movie?.release_date : tvShow?.release_date;

  // Render SVG Graph calculation variables
  let allEpisodesFlat: Episode[] = [];
  let graphWidth = 800;
  let graphHeight = 400;
  let paddingX = 60;
  let paddingY = 50;
  let points: { x: number; y: number; ep: Episode; color: string }[] = [];
  let trendLineCoords: { x1: number; y1: number; x2: number; y2: number } | null = null;
  let gridLinesY: { rating: number; y: number }[] = [];

  const getSeasonColor = (seasonNum: number) => {
    const colors = [
      "#3b82f6", // blue-500
      "#10b981", // emerald-500
      "#a855f7", // purple-500
      "#f97316", // orange-500
      "#06b6d4", // cyan-500
      "#ec4899", // pink-500
      "#f59e0b", // amber-500
      "#84cc16", // lime-500
    ];
    return colors[(seasonNum - 1) % colors.length];
  };

  const getHeatmapBg = (rating: number) => {
    if (rating >= 9.0) return "bg-emerald-600 border-emerald-500 text-white font-bold";
    if (rating >= 8.0) return "bg-emerald-400 border-emerald-300 text-zinc-950 font-semibold";
    if (rating >= 7.0) return "bg-amber-400 border-amber-300 text-zinc-950 font-medium";
    if (rating >= 6.0) return "bg-amber-500 border-amber-600 text-zinc-950";
    if (rating > 0) return "bg-rose-500 border-rose-600 text-white";
    return "bg-zinc-800 border-zinc-700 text-zinc-500";
  };

  if (type === "tv" && episodesData && episodesData.seasons.length > 0) {
    allEpisodesFlat = episodesData.seasons.flatMap((s) => s.episodes);
    const ratedEps = allEpisodesFlat.filter((ep) => ep.vote_count > 0 && ep.vote_average > 0);

    if (ratedEps.length > 0) {
      // Find range of ratings
      const ratings = ratedEps.map((ep) => ep.vote_average);
      const minRating = Math.max(0, Math.floor(Math.min(...ratings) - 0.5));
      const maxRating = Math.min(10, Math.ceil(Math.max(...ratings) + 0.5));

      // Calculate grid coordinates for ratings (Y axis)
      for (let r = minRating; r <= maxRating; r += 1) {
        const y = paddingY + ((maxRating - r) / (maxRating - minRating)) * (graphHeight - 2 * paddingY);
        gridLinesY.push({ rating: r, y });
      }

      // Calculate X coordinate for each episode
      const count = ratedEps.length;
      points = ratedEps.map((ep, index) => {
        const x = paddingX + (index / (count - 1)) * (graphWidth - 2 * paddingX);
        const ratingY = ep.vote_average;
        const y = paddingY + ((maxRating - ratingY) / (maxRating - minRating)) * (graphHeight - 2 * paddingY);
        return { x, y, ep, color: getSeasonColor(ep.season_number) };
      });

      // Linear regression trendline
      const n = ratedEps.length;
      if (n > 1) {
        const sumX = points.reduce((acc, _, i) => acc + i, 0);
        const sumY = points.reduce((acc, p) => acc + p.ep.vote_average, 0);
        const sumXY = points.reduce((acc, p, i) => acc + i * p.ep.vote_average, 0);
        const sumXX = points.reduce((acc, _, i) => acc + i * i, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const startIdx = 0;
        const endIdx = n - 1;

        const y1Val = slope * startIdx + intercept;
        const y2Val = slope * endIdx + intercept;

        const y1 = paddingY + ((maxRating - y1Val) / (maxRating - minRating)) * (graphHeight - 2 * paddingY);
        const y2 = paddingY + ((maxRating - y2Val) / (maxRating - minRating)) * (graphHeight - 2 * paddingY);

        trendLineCoords = {
          x1: points[startIdx].x,
          y1,
          x2: points[endIdx].x,
          y2
        };
      }
    }
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Hero Backdrop Panel */}
      <section
        className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-cover bg-center shadow-2xl"
        style={{
          backgroundImage: showBackdrop ? `linear-gradient(to bottom, rgba(0,0,0,0.85) 60%, rgba(9,9,11,1) 100%), url(${showBackdrop})` : "none"
        }}
      >
        {!showBackdrop && <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950" />}
        <div className="relative z-10 flex flex-col md:flex-row gap-6 p-6 sm:p-10 md:items-end">
          {/* Poster */}
          <div className="w-40 sm:w-48 aspect-[2/3] shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg">
            {showPoster ? (
              <img src={showPoster} alt={showTitle} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-zinc-700 text-3xl">
                {showTitle?.slice(0, 2)}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4 flex-grow">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-red-600 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">
                {type === "movie" ? "Movie" : "TV Show"}
              </span>
              {showRelease && (
                <span className="flex items-center gap-1 text-xs text-zinc-400 font-mono">
                  <Calendar size={13} />
                  {showRelease.split("-")[0]}
                </span>
              )}
              {type === "movie" && movie?.runtime && (
                <span className="flex items-center gap-1 text-xs text-zinc-400 font-mono">
                  <Clock size={13} />
                  {movie.runtime} mins
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {showTitle}
            </h1>
            {showTagline && (
              <p className="text-zinc-400 text-sm sm:text-base italic font-light max-w-3xl">
                "{showTagline}"
              </p>
            )}

            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-3xl font-light">
              {showOverview || "No description available."}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {(showGenres ?? []).map((g) => (
                <span key={g} className="rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs text-zinc-400 font-medium">
                  {g}
                </span>
              ))}
            </div>

            {type === "movie" && (
              <div className="pt-2 text-xs sm:text-sm text-zinc-400 space-y-1">
                {movie?.director && (
                  <p>
                    <span className="font-semibold text-zinc-300">Director: </span>
                    {movie.director}
                  </p>
                )}
                {movie?.cast && movie.cast.length > 0 && (
                  <p className="line-clamp-1">
                    <span className="font-semibold text-zinc-300">Starring: </span>
                    {movie.cast.join(", ")}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <div className="flex items-center gap-1.5 rounded-lg bg-black/60 border border-zinc-800 px-4 py-2 text-sm font-bold text-yellow-500">
                <Star size={16} fill="currentColor" />
                <span>{showRating ? showRating.toFixed(1) : "N/A"}</span>
              </div>

              <button
                onClick={handleWatchlist}
                className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 px-5 py-2.5 text-xs font-semibold text-white transition shadow-lg shadow-red-950/20"
              >
                <Heart size={14} />
                Save Favorite
              </button>

              {watchlistSuccess && (
                <span className="text-xs text-green-400 font-medium animate-pulse">{watchlistSuccess}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TV Episode Ratings Analytics Section */}
      {type === "tv" && episodesData && (
        <section className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 shadow">
              <span className="text-xs text-zinc-500">Average Episode Rating</span>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                ★ {episodesData.stats.average_rating.toFixed(2)}
              </p>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                Across {episodesData.stats.rated_episodes} rated episodes
              </span>
            </div>

            <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 shadow">
              <span className="text-xs text-zinc-500">Total Episodes</span>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                {episodesData.stats.total_episodes}
              </p>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                In {episodesData.seasons.length} seasons
              </span>
            </div>

            <div
              className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 shadow cursor-pointer hover:border-zinc-800 transition"
              onClick={() => episodesData.stats.highest && setActiveEpisode(episodesData.stats.highest)}
            >
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Award size={13} className="text-yellow-500" />
                Highest Rated Episode
              </span>
              <p className="text-sm font-bold text-white mt-1 line-clamp-1">
                {episodesData.stats.highest ? episodesData.stats.highest.name : "N/A"}
              </p>
              <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                ★ {episodesData.stats.highest ? episodesData.stats.highest.vote_average.toFixed(1) : "N/A"}{" "}
                <span className="text-zinc-500 text-[10px]">
                  (S{episodesData.stats.highest?.season_number}E{episodesData.stats.highest?.episode_number})
                </span>
              </span>
            </div>

            <div
              className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 shadow cursor-pointer hover:border-zinc-800 transition"
              onClick={() => episodesData.stats.lowest && setActiveEpisode(episodesData.stats.lowest)}
            >
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <TrendingUp size={13} className="text-rose-500 rotate-180" />
                Lowest Rated Episode
              </span>
              <p className="text-sm font-bold text-white mt-1 line-clamp-1">
                {episodesData.stats.lowest ? episodesData.stats.lowest.name : "N/A"}
              </p>
              <span className="text-[11px] text-rose-500 font-semibold block mt-0.5">
                ★ {episodesData.stats.lowest ? episodesData.stats.lowest.vote_average.toFixed(1) : "N/A"}{" "}
                <span className="text-zinc-500 text-[10px]">
                  (S{episodesData.stats.lowest?.season_number}E{episodesData.stats.lowest?.episode_number})
                </span>
              </span>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <div className="flex gap-2 bg-zinc-950 border border-zinc-900 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("graph")}
                className={`rounded px-4 py-1.5 text-xs font-semibold transition ${activeTab === "graph" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Ratings Graph
              </button>
              <button
                onClick={() => setActiveTab("heatmap")}
                className={`rounded px-4 py-1.5 text-xs font-semibold transition ${activeTab === "heatmap" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Episode Heatmap Grid
              </button>
              <button
                onClick={() => setActiveTab("episodes")}
                className={`rounded px-4 py-1.5 text-xs font-semibold transition ${activeTab === "episodes" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                All Episodes List
              </button>
            </div>

            {/* Color Legend */}
            <div className="hidden md:flex items-center gap-3 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-emerald-600" /> Great (9.0+)
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-emerald-400" /> Good (8.0-8.9)
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-amber-400" /> Avg (7.0-7.9)
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-rose-500" /> Low (&lt; 7.0)
              </span>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            {/* LEFT SIDE: TAB CONTENTS */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4 sm:p-6 shadow min-h-[400px] flex items-center justify-center relative">
              {activeTab === "graph" && (
                <div className="w-full relative">
                  {points.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500 text-xs">
                      No episode rating data available for this show.
                    </div>
                  ) : (
                    <div className="relative">
                      {/* SVG Render */}
                      <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-auto text-zinc-800">
                        {/* Grid Lines Y */}
                        {gridLinesY.map((gl) => (
                          <g key={gl.rating} className="opacity-40">
                            <line
                              x1={paddingX}
                              y1={gl.y}
                              x2={graphWidth - paddingX}
                              y2={gl.y}
                              stroke="currentColor"
                              strokeWidth="0.5"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={paddingX - 10}
                              y={gl.y + 4}
                              fill="zinc-500"
                              fontSize="10"
                              textAnchor="end"
                              className="font-mono text-zinc-500"
                            >
                              {gl.rating.toFixed(1)}
                            </text>
                          </g>
                        ))}

                        {/* Linear Regression Trendline */}
                        {trendLineCoords && (
                          <line
                            x1={trendLineCoords.x1}
                            y1={trendLineCoords.y1}
                            x2={trendLineCoords.x2}
                            y2={trendLineCoords.y2}
                            stroke="#ef4444"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                            opacity="0.85"
                          />
                        )}

                        {/* Connecting Line by Season */}
                        {episodesData.seasons.map((season) => {
                          const seasonPoints = points.filter((p) => p.ep.season_number === season.season_number);
                          if (seasonPoints.length < 2) return null;

                          let pathD = `M ${seasonPoints[0].x} ${seasonPoints[0].y}`;
                          for (let i = 1; i < seasonPoints.length; i++) {
                            pathD += ` L ${seasonPoints[i].x} ${seasonPoints[i].y}`;
                          }

                          return (
                            <path
                              key={season.season_number}
                              d={pathD}
                              fill="none"
                              stroke={getSeasonColor(season.season_number)}
                              strokeWidth="1.5"
                              opacity="0.5"
                            />
                          );
                        })}

                        {/* Episode Dots */}
                        {points.map((pt, i) => (
                          <circle
                            key={i}
                            cx={pt.x}
                            cy={pt.y}
                            r={activeEpisode?.name === pt.ep.name ? "7" : "4.5"}
                            fill={pt.color}
                            stroke={activeEpisode?.name === pt.ep.name ? "#ffffff" : "none"}
                            strokeWidth="2"
                            className="cursor-pointer hover:r-7 transition-all duration-150"
                            onClick={() => {
                              setActiveEpisode(pt.ep);
                            }}
                            onMouseEnter={(e) => {
                              // Estimate parent relative offsets
                              const rect = e.currentTarget.getBoundingClientRect();
                              const svg = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                              if (svg) {
                                setGraphTooltip({
                                  ep: pt.ep,
                                  x: rect.left - svg.left,
                                  y: rect.top - svg.top - 85
                                });
                              }
                            }}
                            onMouseLeave={() => setGraphTooltip(null)}
                          />
                        ))}
                      </svg>

                      {/* Custom SVG Tooltip Overlay */}
                      {graphTooltip && (
                        <div
                          className="absolute z-20 w-48 rounded bg-zinc-950 border border-zinc-800 p-2.5 shadow-xl text-xs space-y-1 pointer-events-none transform -translate-x-1/2"
                          style={{
                            left: `${graphTooltip.x}px`,
                            top: `${graphTooltip.y}px`
                          }}
                        >
                          <div className="flex justify-between font-bold text-white">
                            <span>S{graphTooltip.ep.season_number}E{graphTooltip.ep.episode_number}</span>
                            <span className="text-yellow-500">★ {graphTooltip.ep.vote_average.toFixed(1)}</span>
                          </div>
                          <p className="text-zinc-300 font-semibold truncate">{graphTooltip.ep.name}</p>
                          <p className="text-[10px] text-zinc-500">
                            {graphTooltip.ep.air_date ? graphTooltip.ep.air_date : "N/A"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Season Color Key Footer */}
                  <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 border-t border-zinc-900 pt-4">
                    {episodesData.seasons.map((season) => (
                      <div key={season.season_number} className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: getSeasonColor(season.season_number) }} />
                        <span>Season {season.season_number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "heatmap" && (
                <div className="w-full flex flex-col gap-4 overflow-x-auto py-4">
                  {episodesData.seasons.map((season) => (
                    <div key={season.season_number} className="flex items-center gap-4 min-w-max">
                      {/* Row Label */}
                      <span className="w-24 text-xs font-semibold text-zinc-400 shrink-0">
                        Season {season.season_number}
                      </span>
                      {/* Grid Cells */}
                      <div className="flex gap-1.5">
                        {season.episodes.map((ep) => (
                          <button
                            key={ep.episode_number}
                            onClick={() => setActiveEpisode(ep)}
                            className={`size-10 sm:size-11 rounded border text-xs flex flex-col items-center justify-center transition-all hover:scale-110 hover:border-white shadow-sm ${getHeatmapBg(ep.vote_average)}`}
                          >
                            <span className="text-[8px] text-zinc-500 opacity-60 block leading-none">E{ep.episode_number}</span>
                            <span className="text-sm font-bold block mt-0.5 leading-none">
                              {ep.vote_average > 0 ? ep.vote_average.toFixed(1) : "-"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "episodes" && (
                <div className="w-full text-left space-y-4">
                  {episodesData.seasons.map((season) => (
                    <div key={season.season_number} className="border border-zinc-900 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSeason(expandedSeason === season.season_number ? null : season.season_number)}
                        className="w-full bg-zinc-900/50 hover:bg-zinc-900 px-5 py-3 flex items-center justify-between font-bold text-white transition text-xs sm:text-sm"
                      >
                        <span>Season {season.season_number} ({season.episodes.length} episodes)</span>
                        <span>{expandedSeason === season.season_number ? "▲" : "▼"}</span>
                      </button>

                      {expandedSeason === season.season_number && (
                        <div className="divide-y divide-zinc-900 bg-zinc-950/20">
                          {season.episodes.map((ep) => (
                            <div
                              key={ep.episode_number}
                              onClick={() => setActiveEpisode(ep)}
                              className={`flex gap-4 p-4 hover:bg-zinc-900/10 cursor-pointer transition ${activeEpisode?.name === ep.name ? "bg-zinc-900/30" : ""}`}
                            >
                              <div className="w-24 aspect-[16/9] shrink-0 rounded bg-zinc-900 overflow-hidden border border-zinc-800">
                                {ep.still_url ? (
                                  <img src={ep.still_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-600">
                                    S{ep.season_number}E{ep.episode_number}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-white text-xs sm:text-sm">
                                    E{ep.episode_number}. {ep.name}
                                  </span>
                                  <span className="inline-flex items-center gap-0.5 rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500 border border-yellow-500/20">
                                    ★ {ep.vote_average.toFixed(1)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-500">
                                  Air date: {ep.air_date ? ep.air_date : "Unknown"}
                                </p>
                                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                                  {ep.overview || "No episode description available."}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT SIDE: SELECTED EPISODE DETAIL PANEL */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5 shadow space-y-4 h-fit sticky top-6">
              <h3 className="font-bold text-white text-sm border-b border-zinc-900 pb-2">
                Episode Inspector
              </h3>

              {activeEpisode ? (
                <div className="space-y-4">
                  {/* Episode Thumbnail */}
                  <div className="aspect-[16/9] rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 relative">
                    {activeEpisode.still_url ? (
                      <img src={activeEpisode.still_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-600 text-sm">
                        No Thumbnail
                      </div>
                    )}
                    {/* Floating Rating Tag */}
                    <div className="absolute bottom-2 right-2 rounded-md bg-black/80 border border-zinc-800 px-2 py-0.5 text-xs font-bold text-yellow-500">
                      ★ {activeEpisode.vote_average.toFixed(1)}
                    </div>
                  </div>

                  {/* Title Info */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider font-mono">
                      Season {activeEpisode.season_number} Episode {activeEpisode.episode_number}
                    </span>
                    <h4 className="text-base font-extrabold text-white">
                      {activeEpisode.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Released: {activeEpisode.air_date ? activeEpisode.air_date : "N/A"}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    {activeEpisode.overview || "No overview available for this episode."}
                  </p>
                </div>
              ) : (
                <div className="text-center py-10 text-zinc-600 text-xs flex flex-col items-center gap-1">
                  <Info size={16} />
                  <span>Select an episode to view detail metrics.</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Similar Recommendations Section */}
      <section className="space-y-4 border-t border-zinc-900 pt-8">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Similar Recommendations
          </h2>
          <p className="text-xs text-zinc-500">
            Titles you might like if you enjoyed this show
          </p>
        </div>

        {similar.length === 0 ? (
          <p className="text-zinc-600 text-xs">No recommendations found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {similar.map((item) => (
              <Link
                key={item.id}
                to={`/show/${item.media_type}/${item.id}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-zinc-900 bg-zinc-950 transition hover:border-zinc-800"
              >
                <div className="aspect-[2/3] overflow-hidden bg-zinc-900 relative">
                  {item.poster_url ? (
                    <img src={item.poster_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold text-zinc-700 text-xs">
                      {item.title.slice(0, 2)}
                    </div>
                  )}
                  {/* Rating Tag */}
                  <div className="absolute top-2 right-2 rounded bg-black/85 px-1 py-0.5 text-[9px] font-bold text-yellow-500 border border-zinc-800">
                    ★ {item.vote_average ? item.vote_average.toFixed(1) : "N/A"}
                  </div>
                </div>
                <div className="p-2">
                  <h4 className="text-[11px] font-semibold text-white line-clamp-1 group-hover:text-red-400 transition">
                    {item.title}
                  </h4>
                  <p className="text-[9px] text-zinc-500 mt-0.5">
                    {item.release_date ? item.release_date.split("-")[0] : "N/A"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
