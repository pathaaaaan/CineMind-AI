import { useEffect, useState } from "react";

import { getWatchlist, removeFromWatchlist } from "../api/watchlist.api";
import { MovieCard } from "../components/movie-card";
import type { MovieListItem } from "../types/api";

type Item = { id: string; status: string; movie: MovieListItem; created_at: string };

export function WatchlistPage() {
  const [items, setItems] = useState<Item[]>([]);

  async function load() {
    setItems(await getWatchlist());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Watchlist</h1>
        <p className="mt-2 text-muted-foreground">Saved, favorite, and watched movies live here.</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <MovieCard
            key={item.id}
            movie={item.movie}
            action={{
              label: "Remove",
              onClick: async () => {
                await removeFromWatchlist(item.movie.id);
                await load();
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

