import type { MovieListItem, MovieDetail, Paginated } from '../../src/api/types';
import type { SimilarMovie } from '../../src/api/types/similar';

export function createMockMovie(overrides: Partial<MovieListItem> = {}): MovieListItem {
  return {
    id: 1,
    title: 'The Dark Knight',
    releaseDate: '2008-07-18',
    releaseYear: 2008,
    voteAverage: 9.0,
    voteCount: 30000,
    revenue: 1004558444,
    ...overrides,
  };
}

export function createMockMovieDetail(overrides: Partial<MovieDetail> = {}): MovieDetail {
  return {
    id: 1,
    imdbId: 'tt0468569',
    title: 'The Dark Knight',
    originalTitle: 'The Dark Knight',
    overview:
      'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.',
    tagline: 'Why So Serious?',
    releaseDate: '2008-07-18',
    releaseYear: 2008,
    budget: 185000000,
    revenue: 1004558444,
    runtime: 152,
    voteAverage: 9.0,
    voteCount: 30000,
    popularity: 123.45,
    status: 'Released',
    originalLanguage: 'en',
    genres: [
      { id: 18, name: 'Drama' },
      { id: 28, name: 'Action' },
      { id: 80, name: 'Crime' },
    ],
    cast: [
      { personId: 3894, name: 'Christian Bale', character: 'Bruce Wayne / Batman', order: 0 },
      { personId: 1810, name: 'Heath Ledger', character: 'Joker', order: 1 },
      { personId: 64, name: 'Gary Oldman', character: 'Commissioner Gordon', order: 2 },
    ],
    crew: [
      { personId: 525, name: 'Christopher Nolan', job: 'Director', department: 'Directing' },
      { personId: 525, name: 'Christopher Nolan', job: 'Writer', department: 'Writing' },
      { personId: 13242, name: 'Jonathan Nolan', job: 'Writer', department: 'Writing' },
    ],
    keywords: [
      { id: 849, name: 'dc comics' },
      { id: 9715, name: 'superhero' },
      { id: 8828, name: 'crime fighter' },
    ],
    ratings: {
      average: 4.5,
      count: 1500,
    },
    ...overrides,
  };
}

export function createMockSimilarMovie(overrides: Partial<SimilarMovie> = {}): SimilarMovie {
  return {
    id: 2,
    title: 'Batman Begins',
    releaseYear: 2005,
    voteAverage: 7.7,
    score: 0.85,
    ...overrides,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  overrides: Partial<Paginated<T>> = {},
): Paginated<T> {
  return {
    data,
    total: data.length,
    page: 1,
    pageSize: 20,
    ...overrides,
  };
}

export const mockMovies = [
  createMockMovie({ id: 1, title: 'The Dark Knight', releaseYear: 2008 }),
  createMockMovie({ id: 2, title: 'Inception', releaseYear: 2010, voteAverage: 8.4 }),
  createMockMovie({ id: 3, title: 'Interstellar', releaseYear: 2014, voteAverage: 8.6 }),
  createMockMovie({ id: 4, title: 'The Matrix', releaseYear: 1999, voteAverage: 8.7 }),
  createMockMovie({ id: 5, title: 'Pulp Fiction', releaseYear: 1994, voteAverage: 8.9 }),
];

export const mockSimilarMovies = [
  createMockSimilarMovie({ id: 10, title: 'Batman Begins', score: 0.92 }),
  createMockSimilarMovie({ id: 11, title: 'The Dark Knight Rises', score: 0.88 }),
  createMockSimilarMovie({ id: 12, title: 'Joker', score: 0.75 }),
];
