-- Runs once on first container creation (docker-entrypoint-initdb.d).
-- The main `movies` database is created by POSTGRES_DB; this adds the
-- separate test database so `npm test` never touches ingested data.
CREATE DATABASE movies_test;
