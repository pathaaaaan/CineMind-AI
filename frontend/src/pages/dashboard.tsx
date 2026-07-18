import { useEffect, useState } from "react";

import { api } from "../api/axios";

type Summary = {
  total_searches: number;
  watchlist_count: number;
  favorite_genres: { genre: string; count: number }[];
  recent_queries: string[];
};

export function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api.get<Summary>("/dashboard/summary").then((response) => setSummary(response.data));
  }, []);

  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Searches" value={summary?.total_searches ?? 0} />
        <Metric label="Watchlist" value={summary?.watchlist_count ?? 0} />
        <Metric label="Top genres" value={summary?.favorite_genres.length ?? 0} />
        <Metric label="Recent queries" value={summary?.recent_queries.length ?? 0} />
      </div>
      <section className="rounded-lg border border-border bg-muted p-5 shadow-sm">
        <h2 className="font-semibold">Favorite genres</h2>
        <div className="mt-4 grid gap-2">
          {(summary?.favorite_genres ?? []).map((item) => (
            <div key={item.genre} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
              <span>{item.genre}</span>
              <span>{item.count}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-lg border border-border bg-muted p-5 shadow-sm">
        <h2 className="font-semibold">Recent searches</h2>
        <div className="mt-4 grid gap-2">
          {(summary?.recent_queries ?? []).map((query) => (
            <p key={query} className="rounded-md bg-muted px-3 py-2 text-sm">{query}</p>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

