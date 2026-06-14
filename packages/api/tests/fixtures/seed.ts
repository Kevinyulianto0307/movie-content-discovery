import { sql } from 'drizzle-orm';
import { db } from '@mcd/db';

// Wipes every table. CASCADE + RESTART IDENTITY keeps runs independent.
export async function truncateAll() {
  await db.execute(sql`
    TRUNCATE movies, genres, movie_genres, cast_members, crew_members,
             keywords, movie_keywords, movie_links, ratings
    RESTART IDENTITY CASCADE
  `);
}

// 8 fixture movies (movie 8 carries adult=1 — the API no longer filters on it, so
// it should appear in results). Genres and keywords overlap so the similarity
// endpoint has something to rank.
export async function seedFixtures() {
  await db.execute(sql`
    INSERT INTO genres (id, name) VALUES
      (1,'Action'),(2,'Adventure'),(3,'Fantasy'),(4,'Thriller'),
      (5,'Romance'),(6,'Horror'),(7,'Comedy'),(8,'Drama')
  `);
  await db.execute(sql`
    INSERT INTO movies (id,title,overview,release_date,release_year,vote_average,vote_count,revenue,adult) VALUES
      (1,'Alpha Adventure','A daring hero on an epic quest','1999-07-15',1999,8.0,100,500000,0),
      (2,'Beta Quest','A magical journey through unknown lands','2001-03-22',2001,7.5,80,300000,0),
      (3,'Gamma Strike','A tense action thriller','1995-11-10',1995,7.0,60,200000,0),
      (4,'Delta Romance','A tender love story','2010-02-14',2010,6.5,40,100000,0),
      (5,'Epsilon Horror','A terrifying night in the woods','2015-10-31',2015,6.0,30,50000,0),
      (6,'Zeta Comedy','A laugh-out-loud comedy','2008-06-05',2008,6.8,55,120000,0),
      (7,'Eta Drama','A moving human drama','2012-09-18',2012,7.2,70,150000,0),
      (8,'Theta Adult','Adults-only content','2000-01-01',2000,5.0,10,0,1)
  `);
  await db.execute(sql`
    INSERT INTO movie_genres (movie_id,genre_id) VALUES
      (1,1),(1,2),(2,2),(2,3),(3,1),(3,4),(4,5),(5,6),(6,7),(7,8),(8,1)
  `);
  await db.execute(sql`
    INSERT INTO cast_members (movie_id,person_id,name,character,"order") VALUES
      (1,101,'Jane Doe','Hero',0),
      (1,102,'John Roe','Sidekick',1)
  `);
  await db.execute(sql`
    INSERT INTO crew_members (movie_id,person_id,name,job,department) VALUES
      (1,201,'Dana Director','Director','Directing'),
      (1,202,'Will Writer','Writer','Writing')
  `);
  await db.execute(sql`INSERT INTO keywords (id,name) VALUES (10,'quest'),(11,'hero'),(12,'magic')`);
  await db.execute(sql`INSERT INTO movie_keywords (movie_id,keyword_id) VALUES (1,10),(1,11),(2,10),(2,12)`);
  await db.execute(sql`INSERT INTO movie_links (movielens_id,tmdb_id) VALUES (9001,1),(9002,2)`);
  await db.execute(sql`
    INSERT INTO ratings (user_id,movie_id,rating,timestamp) VALUES
      (1,1,4.5,1000),(2,1,3.5,1001),(3,2,5.0,1002)
  `);
  await db.execute(sql`
    UPDATE movies SET search_vector =
      setweight(to_tsvector('english', coalesce(title, '')),    'A') ||
      setweight(to_tsvector('english', coalesce(overview, '')), 'D')
  `);
}
