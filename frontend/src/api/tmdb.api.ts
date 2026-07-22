import { api } from "./axios";

export interface TmdbSearchResult {
  id: number;
  title: string;
  original_title?: string;
  media_type: "movie" | "tv";
  overview: string;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  poster_url: string | null;
  backdrop_url: string | null;
}

export interface TvDetails {
  id: number;
  title: string;
  original_title?: string;
  media_type: "tv";
  overview: string;
  tagline?: string;
  release_date?: string;
  last_air_date?: string;
  status: string;
  networks: string[];
  genres: string[];
  vote_average: number;
  vote_count: number;
  poster_url: string | null;
  backdrop_url: string | null;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons_list: {
    season_number: number;
    episode_count: number;
    name: string;
  }[];
}

export interface Episode {
  name: string;
  season_number: number;
  episode_number: number;
  vote_average: number;
  vote_count: number;
  air_date: string | null;
  overview: string;
  still_url: string | null;
}

export interface SeasonData {
  season_number: number;
  name: string;
  episodes: Episode[];
}

export interface TvEpisodesData {
  show: {
    id: number;
    title: string;
    poster_url: string | null;
    backdrop_url: string | null;
    vote_average: number;
    genres: string[];
  };
  seasons: SeasonData[];
  stats: {
    total_episodes: number;
    rated_episodes: number;
    average_rating: number;
    highest: Episode | null;
    lowest: Episode | null;
  };
}

export interface MovieDetails {
  id: number;
  title: string;
  original_title?: string;
  media_type: "movie";
  overview: string;
  tagline?: string;
  release_date?: string;
  runtime: number;
  genres: string[];
  director: string | null;
  cast: string[];
  vote_average: number;
  vote_count: number;
  poster_url: string | null;
  backdrop_url: string | null;
}

export interface SimilarItem {
  id: number;
  title: string;
  media_type: "movie" | "tv";
  overview: string;
  release_date?: string;
  vote_average: number;
  poster_url: string | null;
}

export interface TopRatedTVShow {
  id: number;
  rank: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  year: string;
  vote_average: number;
  vote_count: number;
  custom_score: number;
  poster_url: string | null;
  backdrop_url: string | null;
  genres: string[];
  episode_count: number;
  status: string;
}

export interface PopularDashboardData {
  popular_tv: {
    id: number;
    title: string;
    vote_average: number;
    poster_url: string | null;
    release_date?: string;
  }[];
  popular_movies: {
    id: number;
    title: string;
    vote_average: number;
    poster_url: string | null;
    release_date?: string;
  }[];
  custom_charts: {
    title: string;
    id: number;
    episodes: number;
    rating: number;
    likes: number;
    creator: string;
    poster_url: string;
    heatmap: number[][];
  }[];
}

export async function searchMulti(query: string): Promise<TmdbSearchResult[]> {
  const { data } = await api.get<{ results: TmdbSearchResult[] }>("/tmdb/search", { params: { query } });
  return data.results;
}

export async function getTvDetails(id: number | string): Promise<TvDetails> {
  const { data } = await api.get<TvDetails>(`/tmdb/tv/${id}`);
  return data;
}

export async function getTvEpisodes(id: number | string): Promise<TvEpisodesData> {
  const { data } = await api.get<TvEpisodesData>(`/tmdb/tv/${id}/episodes`);
  return data;
}

export async function getMovieDetails(id: number | string): Promise<MovieDetails> {
  const { data } = await api.get<MovieDetails>(`/tmdb/movie/${id}`);
  return data;
}

export async function getSimilarItems(mediaType: "movie" | "tv", id: number | string): Promise<SimilarItem[]> {
  const { data } = await api.get<{ results: SimilarItem[] }>(`/tmdb/similar/${mediaType}/${id}`);
  return data.results;
}

export async function getTopRatedTV(params?: { genre?: string; status?: string; sort_by?: string }): Promise<TopRatedTVShow[]> {
  const { data } = await api.get<{ results: TopRatedTVShow[] }>("/tmdb/top_rated", { params });
  return data.results;
}

export async function getPopularDashboard(): Promise<PopularDashboardData> {
  const { data } = await api.get<PopularDashboardData>("/tmdb/popular");
  return data;
}
