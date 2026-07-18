import { Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";

import type { MovieListItem } from "../types/api";
import { Button } from "./ui/button";

type Props = {
  movie: MovieListItem;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function MovieCard({ movie, action }: Props) {
  return (
    <article className="rounded-lg border border-border bg-muted p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="flex aspect-[2/3] w-20 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
          {movie.poster_url ? <img src={movie.poster_url} alt="" className="h-full w-full rounded-md object-cover" /> : movie.title.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <Link to={`/movies/${movie.id}`} className="font-semibold hover:text-primary">
            {movie.title}
          </Link>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{movie.overview ?? "No overview available."}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {movie.runtime ? (
              <span className="inline-flex items-center gap-1">
                <Clock size={14} /> {movie.runtime}m
              </span>
            ) : null}
            {movie.vote_average ? (
              <span className="inline-flex items-center gap-1">
                <Star size={14} /> {movie.vote_average.toFixed(1)}
              </span>
            ) : null}
            {(movie.genres ?? []).slice(0, 3).map((genre) => (
              <span key={genre} className="rounded-sm bg-muted px-2 py-1">
                {genre}
              </span>
            ))}
          </div>
          {action ? (
            <Button className="mt-4" variant="secondary" onClick={action.onClick}>
              {action.label}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

