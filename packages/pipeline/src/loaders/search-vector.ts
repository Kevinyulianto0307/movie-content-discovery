import { pool } from '@mcd/db';

// Post-insert step: populate the tsvector for full-text search. setweight ranks
// title > original_title > tagline > overview so title matches outrank body
// matches in ts_rank. Run once after all movies are loaded.
export async function populateSearchVector(): Promise<void> {
  await pool.query(`
    UPDATE movies SET search_vector =
      setweight(to_tsvector('english', coalesce(title, '')),          'A') ||
      setweight(to_tsvector('english', coalesce(original_title, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(tagline, '')),        'C') ||
      setweight(to_tsvector('english', coalesce(overview, '')),       'D')
  `);
}
