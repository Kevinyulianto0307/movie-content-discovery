// Movie domain response shapes: list item, full detail, and the nested entities
// that make up a detail (genres, keywords, cast, crew, rating stats).

export interface MovieListItem {
  id: number;
  title: string;
  releaseDate: string | null;
  releaseYear: number | null;
  voteAverage: number | null;
  voteCount: number | null;
  revenue: number | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Keyword {
  id: number;
  name: string;
}

export interface CastMember {
  personId: number | null;
  name: string | null;
  character: string | null;
  order: number | null;
}

export interface CrewMember {
  personId: number | null;
  name: string | null;
  job: string | null;
  department: string | null;
}

export interface RatingStats {
  average: number | null;
  count: number;
}

export interface MovieDetail {
  id: number;
  imdbId: string | null;
  title: string;
  originalTitle: string | null;
  overview: string | null;
  tagline: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  budget: number | null;
  revenue: number | null;
  runtime: number | null;
  voteAverage: number | null;
  voteCount: number | null;
  popularity: number | null;
  status: string | null;
  originalLanguage: string | null;
  genres: Genre[];
  cast: CastMember[];
  crew: CrewMember[];
  keywords: Keyword[];
  ratings: RatingStats;
}
