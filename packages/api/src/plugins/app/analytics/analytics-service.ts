import fp from "fastify-plugin";
import type { AnalyticsQuery } from "../../../schemas/analytics.schema.ts";
import type { AnalyticsRepository } from "./analytics-repository.ts";

declare module "fastify" {
  interface FastifyInstance {
    analyticsService: AnalyticsService;
  }
}

export function makeAnalyticsService(repo: AnalyticsRepository) {
  return {
    async topGenres(q: AnalyticsQuery) {
      const data = await repo.topGenres(q.bucket, q.minVotes);
      return { data };
    },
  };
}

export type AnalyticsService = ReturnType<typeof makeAnalyticsService>;

/* v8 ignore start */
export default fp(
  async (fastify) => {
    fastify.decorate("analyticsService", makeAnalyticsService(fastify.analyticsRepository));
  },
  { name: "analytics-service", dependencies: ["analytics-repository"] },
);
/* v8 ignore stop */
