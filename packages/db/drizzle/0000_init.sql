CREATE TABLE "cast_members" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cast_members_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"movie_id" integer NOT NULL,
	"person_id" integer,
	"name" text,
	"character" text,
	"order" integer
);
--> statement-breakpoint
CREATE TABLE "crew_members" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "crew_members_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"movie_id" integer NOT NULL,
	"person_id" integer,
	"name" text,
	"job" text,
	"department" text
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "keywords" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "keywords_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "movie_genres" (
	"movie_id" integer NOT NULL,
	"genre_id" integer NOT NULL,
	CONSTRAINT "movie_genres_movie_id_genre_id_pk" PRIMARY KEY("movie_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "movie_keywords" (
	"movie_id" integer NOT NULL,
	"keyword_id" integer NOT NULL,
	CONSTRAINT "movie_keywords_movie_id_keyword_id_pk" PRIMARY KEY("movie_id","keyword_id")
);
--> statement-breakpoint
CREATE TABLE "movie_links" (
	"movielens_id" integer PRIMARY KEY NOT NULL,
	"tmdb_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" integer PRIMARY KEY NOT NULL,
	"imdb_id" text,
	"title" text NOT NULL,
	"original_title" text,
	"overview" text,
	"tagline" text,
	"release_date" text,
	"release_year" integer,
	"budget" real,
	"revenue" real,
	"runtime" real,
	"vote_average" real,
	"vote_count" integer,
	"popularity" real,
	"status" text,
	"original_language" text,
	"adult" integer DEFAULT 0,
	"search_vector" "tsvector"
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"user_id" integer NOT NULL,
	"movie_id" integer NOT NULL,
	"rating" real,
	"timestamp" integer,
	CONSTRAINT "ratings_user_id_movie_id_pk" PRIMARY KEY("user_id","movie_id")
);
--> statement-breakpoint
ALTER TABLE "cast_members" ADD CONSTRAINT "cast_members_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew_members" ADD CONSTRAINT "crew_members_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_keywords" ADD CONSTRAINT "movie_keywords_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_keywords" ADD CONSTRAINT "movie_keywords_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cast_movie" ON "cast_members" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "idx_crew_movie" ON "crew_members" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "idx_movie_genres_genre" ON "movie_genres" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "idx_movie_keywords_keyword" ON "movie_keywords" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "idx_links_tmdb" ON "movie_links" USING btree ("tmdb_id");--> statement-breakpoint
CREATE INDEX "idx_movies_year" ON "movies" USING btree ("release_year");--> statement-breakpoint
CREATE INDEX "idx_movies_vote" ON "movies" USING btree ("vote_average");--> statement-breakpoint
CREATE INDEX "idx_ratings_movie" ON "ratings" USING btree ("movie_id");