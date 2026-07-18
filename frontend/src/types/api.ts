export type User = {
  id: string;
  email: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
};

export type Movie = {
  id: string;
  tmdb_id?: number | null;
  title: string;
  original_title?: string | null;
  overview?: string | null;
  tagline?: string | null;
  genres?: string[] | null;
  cast?: string[] | null;
  director?: string | null;
  production_companies?: string[] | null;
  runtime?: number | null;
  release_date?: string | null;
  vote_average?: number | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
};

export type MovieListItem = Pick<Movie, "id" | "title" | "overview" | "genres" | "runtime" | "vote_average" | "poster_url">;

export type Recommendation = {
  movie: MovieListItem;
  similarity_score: number;
  explanation: {
    why_recommended: string;
    similar_themes: string[];
    similar_genres: string[];
    storytelling_elements: string[];
  };
};

