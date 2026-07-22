import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Film, Heart, LayoutDashboard, Search, Sparkles, TrendingUp, Users } from "lucide-react";
import { getPopularDashboard, type PopularDashboardData } from "../api/tmdb.api";

export function HomePage() {
  const [data, setData] = useState<PopularDashboardData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getPopularDashboard()
      .then(setData)
      .catch((err: any) => console.error("Failed to load dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const trySearch = (term: string, path: string) => {
    navigate(path);
  };

  // Maps ratings (0.0 to 1.0 or 0 to 10) to beautiful colors matching SeriesGraph
  const getHeatmapColor = (rating: number) => {
    // If database stores it out of 10
    const val = rating > 1 ? rating / 10 : rating;
    if (val >= 0.9) return "bg-emerald-500";
    if (val >= 0.8) return "bg-emerald-400";
    if (val >= 0.7) return "bg-amber-400";
    if (val >= 0.6) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="space-y-16 py-6 pb-20">
      {/* 1. Hero / Search Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 via-black to-zinc-950 px-6 py-16 text-center border border-zinc-800 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.08),transparent_50%)]" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          {/* Top banner tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs font-medium text-red-400">
            <Sparkles size={12} />
            <span>AI-Powered Episode & Movie Analysis</span>
          </div>

          <h1 className="text-4xl font-extrabold sm:text-6xl tracking-tight leading-none bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Explore episodes through ratings graphs
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Dive into the highs and lows, discover hidden gems, and chart your binge-worthy course through the captivating world of television—all in one glance!
          </p>

          {/* Central Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto mt-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <input
                type="text"
                placeholder="Search for a show, movie, or anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-zinc-800 bg-zinc-900/90 py-3.5 pl-12 pr-6 text-sm text-white placeholder-zinc-500 shadow-lg outline-none ring-1 ring-transparent focus:border-red-500/50 focus:ring-red-500/25 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-red-600 px-5 py-2 text-xs font-semibold hover:bg-red-500 transition-all text-white"
              >
                Search
              </button>
            </div>
          </form>

          {/* Suggestions */}
          <div className="text-xs text-zinc-500 mt-3">
            <span>You can try: </span>
            <button
              onClick={() => trySearch("The Simpsons", "/show/tv/456")}
              className="text-zinc-400 hover:text-red-400 underline decoration-zinc-700 transition"
            >
              The Simpsons
            </button>
            {", "}
            <button
              onClick={() => trySearch("Breaking Bad", "/show/tv/1396")}
              className="text-zinc-400 hover:text-red-400 underline decoration-zinc-700 transition"
            >
              Breaking Bad
            </button>
            {", "}
            <button
              onClick={() => trySearch("Dexter", "/show/tv/1402")}
              className="text-zinc-400 hover:text-red-400 underline decoration-zinc-700 transition"
            >
              Dexter
            </button>
          </div>
        </div>
      </section>

      {/* 2. Quick Links Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/top-rated"
          className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-700 hover:bg-zinc-900"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2.5 text-red-500 group-hover:bg-red-500/20 transition">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm sm:text-base">Top 250 Series</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Highest rated shows</p>
            </div>
          </div>
        </Link>

        <Link
          to="/search"
          className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-700 hover:bg-zinc-900"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2.5 text-red-500 group-hover:bg-red-500/20 transition">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm sm:text-base">AI Discovery</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Semantic search recommendations</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard"
          className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-700 hover:bg-zinc-900"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2.5 text-red-500 group-hover:bg-red-500/20 transition">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm sm:text-base">Community</h3>
              <p className="text-xs text-zinc-500 mt-0.5">See what others watch</p>
            </div>
          </div>
        </Link>

        <Link
          to="/watchlist"
          className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-700 hover:bg-zinc-900"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2.5 text-red-500 group-hover:bg-red-500/20 transition">
              <Heart size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm sm:text-base">Your Charts</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Rate & save custom lists</p>
            </div>
          </div>
        </Link>
      </section>

      {/* 3. Popular TV Series Slider */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide sm:text-2xl">Popular TV Series</h2>
            <p className="text-xs text-zinc-500 mt-1">What people are watching right now</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] w-full animate-pulse rounded-lg bg-zinc-900" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
            {(data?.popular_tv ?? []).map((show, index) => (
              <Link
                key={show.id}
                to={`/show/tv/${show.id}`}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-zinc-900 bg-zinc-950 transition hover:-translate-y-1 hover:border-zinc-800"
              >
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

                  {/* Rank Number Overlay */}
                  <div className="absolute bottom-[-10px] left-[-5px] z-10 select-none text-7xl font-extrabold text-white/10 italic group-hover:text-red-500/20 transition duration-300">
                    {index + 1}
                  </div>

                  {/* Vote Average badge */}
                  <div className="absolute top-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500 border border-zinc-800">
                    ★ {show.vote_average ? show.vote_average.toFixed(1) : "N/A"}
                  </div>
                </div>

                <div className="p-2.5 flex-grow flex flex-col justify-between">
                  <h4 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-red-400 transition">
                    {show.title}
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {show.release_date ? show.release_date.split("-")[0] : "N/A"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. Popular Custom Charts heatmap section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide sm:text-2xl">Popular Custom Charts</h2>
          <p className="text-xs text-zinc-500 mt-1">See how the community rates their favorite shows, episode by episode</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {(data?.custom_charts ?? []).map((chart) => (
            <Link
              key={chart.id}
              to={`/show/tv/${chart.id}`}
              className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 hover:bg-zinc-900 transition hover:border-zinc-700 group"
            >
              {/* Poster on left */}
              <div className="w-16 h-24 shrink-0 rounded overflow-hidden bg-zinc-900">
                <img src={chart.poster_url} alt={chart.title} className="w-full h-full object-cover" />
              </div>

              {/* Title & Metadata in center */}
              <div className="flex-grow min-w-0">
                <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-red-400 transition truncate">
                  {chart.title}
                </h3>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-400">
                  <span>{chart.episodes} eps</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-yellow-500">★ {chart.rating}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-red-400">❤ {chart.likes}</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 truncate">by @{chart.creator}</p>
              </div>

              {/* Heatmap Grid on right */}
              <div className="flex flex-col gap-0.5 shrink-0 bg-black/30 p-1.5 rounded-lg border border-zinc-900">
                {chart.heatmap.slice(0, 5).map((row: number[], rIdx: number) => (
                  <div key={rIdx} className="flex gap-0.5">
                    {row.slice(0, 10).map((rating: number, cIdx: number) => (
                      <div
                        key={cIdx}
                        className={`w-2.5 h-2.5 rounded-[1px] transition-all hover:scale-125 ${getHeatmapColor(rating)}`}
                        title={`Rating: ${(rating * 10).toFixed(1)}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Popular Franchises */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide sm:text-2xl">Popular Franchises</h2>
          <p className="text-xs text-zinc-500 mt-1">TV universes and series with multiple shows</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
          {[
            { name: "007 Collection", tmdbId: 645, url: "https://image.tmdb.org/t/p/w500/HORgzYqQo14yT9Gj5u9QpxL99.jpg" },
            { name: "Avengers Collection", tmdbId: 86311, url: "https://image.tmdb.org/t/p/w500/n930zs7iQvhmg1W9039GZqppH35.jpg" },
            { name: "Iron Man Collection", tmdbId: 131292, url: "https://image.tmdb.org/t/p/w500/775gQ6Q110gCly9t325QY28qD.jpg" },
            { name: "Harry Potter Collection", tmdbId: 1241, url: "https://image.tmdb.org/t/p/w500/eVjvISZc3c396H2C44gnsGjua2u.jpg" },
            { name: "Alien Collection", tmdbId: 8091, url: "https://image.tmdb.org/t/p/w500/r0462W99yGpxzYfU3k1aKx4w6.jpg" },
            { name: "Mad Max Collection", tmdbId: 8933, url: "https://image.tmdb.org/t/p/w500/91tO814r7d6fLp787qTep8Jq1vB.jpg" },
            { name: "Star Wars", tmdbId: 10, url: "https://image.tmdb.org/t/p/w500/wd92vE7V2Gsh0V87x2L3k5l1G.jpg" },
            { name: "Terminator", tmdbId: 2187, url: "https://image.tmdb.org/t/p/w500/5A6P173y4N07kZ8ZtG34wM7iZ.jpg" }
          ].map((franchise) => (
            <Link
              key={franchise.tmdbId}
              to={`/search?q=${encodeURIComponent(franchise.name)}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-zinc-900 bg-zinc-950 transition hover:border-zinc-800 hover:-translate-y-0.5"
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                <img
                  src={franchise.url}
                  alt={franchise.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-2">
                <h4 className="text-[11px] font-semibold text-white line-clamp-1 group-hover:text-red-400 transition text-center">
                  {franchise.name}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Top Users This Week */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide sm:text-2xl">Top Users This Week</h2>
          <p className="text-xs text-zinc-500 mt-1">Most active contributors in the CineMind community</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
          {[
            { name: "A.tom", initial: "A", ep: "4.7K", charts: 32 },
            { name: "roc riambau", initial: "R", ep: "3.0K", charts: 20 },
            { name: "Woman_Of_T", initial: "W", ep: "2.9K", charts: 32 },
            { name: "Caprisun", initial: "C", ep: "2.9K", charts: 34 },
            { name: "Дэн228", initial: "Д", ep: "2.7K", charts: 39 },
            { name: "Redd", initial: "R", ep: "2.5K", charts: 36 },
            { name: "Ultimate135", initial: "U", ep: "2.4K", charts: 41 },
            { name: "world space", initial: "W", ep: "2.3K", charts: 27 }
          ].map((user, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 text-center hover:border-zinc-800 transition"
            >
              <div className="relative">
                <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-950 border border-zinc-700 text-white font-bold text-sm">
                  {user.initial}
                </div>
                {/* Ranking badge */}
                <div className="absolute -bottom-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-red-600 border border-black text-[9px] font-bold text-white">
                  {idx + 1}
                </div>
              </div>
              <h4 className="text-xs font-semibold text-white mt-3 truncate w-full">{user.name}</h4>
              <p className="text-[10px] text-zinc-400 mt-1 font-medium">{user.ep} episodes</p>
              <p className="text-[9px] text-zinc-500 mt-0.5">{user.charts} charts</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
