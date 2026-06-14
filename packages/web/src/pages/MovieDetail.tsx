import { Link, useParams } from 'react-router-dom';
import { MovieCard } from '../components/MovieCard.js';
import { StateMessage } from '../components/StateMessage.js';
import { MovieDetailSkeleton, MovieGridSkeleton } from '../components/Skeleton.js';
import { useMovieDetail } from '../hooks/useMovieDetail.js';
import { formatRating } from '../lib/format.js';
import styles from './MovieDetail.module.css';

export function MovieDetail() {
  const params = useParams();
  const id = Number(params.id);
  const validId = Number.isFinite(id) && id > 0;
  const { movie, similar, directors, writers } = useMovieDetail(id);

  if (!validId) {
    return <StateMessage kind="error">Invalid movie id.</StateMessage>;
  }
  if (movie.isLoading) return <MovieDetailSkeleton />;
  if (movie.isError) {
    return (
      <StateMessage kind="error">
        Couldn&apos;t load this movie. It may not exist, or the API may be down.
      </StateMessage>
    );
  }
  if (!movie.data) return <StateMessage kind="empty">Movie not found.</StateMessage>;

  const m = movie.data;

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>
        ← Back to browse
      </Link>

      <header className={styles.header}>
        <h2 className={styles.title}>
          {m.title} {m.releaseYear ? <span className={styles.year}>({m.releaseYear})</span> : null}
        </h2>
        {m.tagline ? <p className={styles.tagline}>{m.tagline}</p> : null}
        <div className={styles.badges}>
          <span className={styles.rating}>★ {formatRating(m.voteAverage)}</span>
          {m.runtime ? <span>{m.runtime} min</span> : null}
          {m.ratings.count > 0 ? (
            <span>
              {m.ratings.average?.toFixed(2)} avg user rating ({m.ratings.count} ratings)
            </span>
          ) : null}
        </div>
        {m.genres.length > 0 ? (
          <div className={styles.genres}>
            {m.genres.map((g) => (
              <span key={g.id} className={styles.genre}>
                {g.name}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      {m.overview ? <p className={styles.overview}>{m.overview}</p> : null}

      <section className={styles.cols}>
        <div>
          <h3 className={styles.h3}>Top cast</h3>
          {m.cast.length === 0 ? (
            <p className={styles.muted}>No cast listed.</p>
          ) : (
            <ul className={styles.list}>
              {m.cast.map((c, i) => (
                <li key={`${c.personId}-${i}`}>
                  <strong>{c.name}</strong>
                  {c.character ? <span className={styles.muted}> as {c.character}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className={styles.h3}>Crew</h3>
          <ul className={styles.list}>
            {directors.length > 0 ? (
              <li>
                <span className={styles.muted}>Director:</span>{' '}
                {directors.map((d) => d.name).join(', ')}
              </li>
            ) : null}
            {writers.length > 0 ? (
              <li>
                <span className={styles.muted}>Writer:</span>{' '}
                {writers.map((w) => w.name).join(', ')}
              </li>
            ) : null}
            {directors.length === 0 && writers.length === 0 ? (
              <li className={styles.muted}>No key crew listed.</li>
            ) : null}
          </ul>
          {m.keywords.length > 0 ? (
            <>
              <h3 className={styles.h3}>Keywords</h3>
              <div className={styles.genres}>
                {m.keywords.slice(0, 12).map((k) => (
                  <span key={k.id} className={styles.keyword}>
                    {k.name}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section>
        <h3 className={styles.h3}>Similar movies</h3>
        {similar.isLoading ? (
          <div className={styles.grid}>
            <MovieGridSkeleton count={5} />
          </div>
        ) : similar.isError ? (
          <StateMessage kind="error">Couldn&apos;t load similar movies.</StateMessage>
        ) : !similar.data || similar.data.data.length === 0 ? (
          <StateMessage kind="empty">No similar movies found.</StateMessage>
        ) : (
          <div className={styles.grid}>
            {similar.data.data.map((s) => (
              <MovieCard key={s.id} movie={s} subtitle={`similarity ${s.score}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
