import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

// OpenAPI docs generated from the Zod route schemas, served at /documentation.
// Wrapped in fp() because it needs custom registration logic (two plugins + the
// zod -> JSON Schema transform) rather than a plain autoConfig options object.
//
// @see https://github.com/fastify/fastify-swagger
export default fp(
  async function (fastify) {
    await fastify.register(swagger, {
      openapi: {
        info: { title: "MovieContentDiscovery API", version: "0.1.0" },
        tags: [
          { name: "Movies", description: "Browse, detail, and similarity" },
          { name: "Search", description: "Full-text search" },
          { name: "Analytics", description: "Aggregate stats" },
          { name: "Health", description: "Liveness" },
        ],
      },
      transform: jsonSchemaTransform,
    });

    await fastify.register(swaggerUi, { routePrefix: "/documentation" });
  },
  { name: "swagger" },
);
