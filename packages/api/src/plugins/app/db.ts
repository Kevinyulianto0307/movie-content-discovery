import fp from "fastify-plugin";
import { db as defaultDb, type Db } from "@mcd/db";

declare module "fastify" {
  interface FastifyInstance {
    db: Db;
  }
}

export interface DbPluginOptions {
  db?: Db;
}

// Decorates the Drizzle client onto the instance. The `db` is injectable so tests
// can pass a stub (see the DB-failure test) without module mocking; production
// falls back to the shared @mcd/db client. Every repository plugin declares
// `dependencies: ['db']`, so autoload always registers this one first.
export default fp(
  async (fastify, opts: DbPluginOptions) => {
    fastify.decorate("db", opts.db ?? defaultDb);
  },
  { name: "db" },
);
