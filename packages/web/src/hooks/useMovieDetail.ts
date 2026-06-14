import { useMovie } from './useMovie.js';
import { useSimilarMovies } from './useSimilarMovies.js';

/**
 * Presenter hook for the MovieDetail screen.
 *
 * Fetches the movie details and similar titles, then derives key crew groupings
 * (directors, writers) so the page component only handles rendering.
 *
 * @param id - The movie ID to fetch (from URL params)
 * @returns Queries and derived data:
 * - `movie` - TanStack Query result for movie details
 * - `similar` - TanStack Query result for similar movies
 * - `directors` - Filtered crew members with job "Director"
 * - `writers` - Filtered crew members with job "Writer"
 *
 * @example
 * const { movie, similar, directors } = useMovieDetail(123);
 * if (movie.isLoading) return <MovieDetailSkeleton />;
 * return <h1>{movie.data.title}</h1>;
 */
export function useMovieDetail(id: number) {
  const movie = useMovie(id);
  const similar = useSimilarMovies(id);

  const crew = movie.data?.crew ?? [];
  const directors = crew.filter((c) => c.job === 'Director');
  const writers = crew.filter((c) => c.job === 'Writer');

  return { movie, similar, directors, writers };
}
