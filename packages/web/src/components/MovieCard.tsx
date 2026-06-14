import { Link } from 'react-router-dom';
import { formatRating, formatYear } from '../lib/format.js';
import styles from './MovieCard.module.css';

// Loose coupling: MovieCard owns its display contract via this local type.
// Callers map their data (API rows, similar-movie rows, etc.) into this shape,
// so the component never has to know which endpoint produced the data.
export interface MovieCardData {
  id: number;
  title: string;
  releaseYear: number | null;
  voteAverage: number | null;
}

interface Props {
  movie: MovieCardData;
  subtitle?: string;
}

export function MovieCard({ movie, subtitle }: Props) {
  return (
    <Link to={`/movies/${movie.id}`} className={styles.card} data-testid="movie-card">
      <div className={styles.title}>{movie.title}</div>
      <div className={styles.meta}>
        <span>{formatYear(movie.releaseYear)}</span>
        <span className={styles.rating}>★ {formatRating(movie.voteAverage)}</span>
      </div>
      {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
    </Link>
  );
}
