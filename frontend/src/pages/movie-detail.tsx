import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { addToWatchlist } from "../api/watchlist.api";
import { getMovie, getSimilarMovies } from "../api/movies.api";
import { MovieCard } from "../components/movie-card";
import { Button } from "../components/ui/button";
import type { Movie, MovieListItem } from "../types/api";

export function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [similar, setSimilar] = useState<{ movie: MovieListItem; similarity_score: number }[]>([]);

  useEffect(() => {
    if (!id) return;
    getMovie(id).then(setMovie);
    getSimilarMovies(id).then(setSimilar);
  }, [id]);

  if (!movie) {
    return <p className="text-muted-foreground">Loading movie...</p>;
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-border bg-muted p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row">
          <div className="flex aspect-[2/3] w-36 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {movie.poster_url ? <img src={movie.poster_url} alt="" className="h-full w-full rounded-md object-cover" /> : movie.title.slice(0, 2)}
          </div>
          <div>
            <h1 className="text-3xl font-semibold">{movie.title}</h1>
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{movie.overview}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(movie.genres ?? []).map((genre) => (
                <span key={genre} className="rounded-sm bg-muted px-2 py-1 text-sm">{genre}</span>
              ))}
            </div>
            <div className="mt-5 grid gap-1 text-sm text-muted-foreground">
              <span>Director: {movie.director ?? "Unknown"}</span>
              <span>Runtime: {movie.runtime ?? "Unknown"} minutes</span>
              <span>Rating: {movie.vote_average ?? "N/A"}</span>
            </div>
            <Button className="mt-5" onClick={() => id && addToWatchlist(id, "favorite")}>
              <Heart size={16} />
              Save favorite
            </Button>
          </div>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">Similar movies</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {similar.map((item) => <MovieCard key={item.movie.id} movie={item.movie} />)}
        </div>
      </section>
    </div>
  );
}

