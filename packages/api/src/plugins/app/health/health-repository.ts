import fp from "fastify-plugin";
import { sql } from "drizzle-orm";
import type { Db } from "@mcd/db";

declare module "fastify" {
  interface FastifyInstance {
    healthRepository: HealthRepository;
  }
}

// Liveness probe for the DB connection. Throws if the database is unreachable;
// the route decides how to surface that.
export function makeHealthRepository(db: Db) {
  return {
    async ping(): Promise<void> {
      await db.execute(sql`SELECT 1`);
    },
  };
}

export type HealthRepository = ReturnType<typeof makeHealthRepository>;

// Fastify adapter: decorate the repository, built from the injected db client.
/* v8 ignore start */
export default fp(
  async (fastify) => {
    fastify.decorate("healthRepository", makeHealthRepository(fastify.db));
  },
  { name: "health-repository", dependencies: ["db"] },
);
/* v8 ignore stop */
