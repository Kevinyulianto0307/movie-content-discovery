import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import autoload from "@fastify/autoload";
import {
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
} from "fastify-type-provider-zod";
import type { Db } from "@mcd/db";

export interface AppOptions {
  // The database handle. Defaults to the shared @mcd/db client; tests inject a
  // stub here to exercise routes without (or against a failing) database.
  db?: Db;
}

// Application layer: everything that *defines* the API, expressed as a single
// Fastify plugin. server.ts owns the runtime (instance creation, logging, listen);
// this file composes the app by autoloading three directories in order:
//   1. plugins/external — third-party plugins (cors, swagger)
//   2. plugins/app      — our own support plugins (DI container)
//   3. routes           — the HTTP routes, which depend on the above
export default async function serviceApp(
  fastify: FastifyInstance,
  opts: AppOptions,
) {
  // Zod drives both request validation and response serialization. The compilers
  // must be set before any routes register. Response serialization strips any
  // field not in the declared schema (so e.g. search_vector can never leak).
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Map Zod request-validation failures to our stable error shape; the explicit
  // 404 in the detail route is sent directly (not thrown) so it skips this.
  // Everything else (e.g. an unreachable DB) surfaces as a 500.
  fastify.setErrorHandler((err, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(err)) {
      const code =
        err.validationContext === "params" ? "invalid_params" : "invalid_query";
      return reply.code(400).send({ error: code, issues: err.validation });
    }
    req.log?.error(err);
    return reply.code(500).send({ error: "internal_server_error" });
  });

  // 1. External plugins — registered first since app plugins/routes depend on them.
  await fastify.register(autoload, {
    dir: join(import.meta.dirname, "plugins/external"),
  });

  // 2. App plugins — db connection + per-domain repositories/services, each a
  //    plugin that decorates the instance (app.moviesService, app.searchRepository,
  //    ...). `db` is threaded through so tests can inject a stub; repositories
  //    declare `dependencies: ['db']` so autoload registers db first.
  fastify.register(autoload, {
    dir: join(import.meta.dirname, "plugins/app"),
    options: { db: opts.db },
  });

  // 3. Routes — folders map to URLs (routes/api/movies -> /api/movies,
  //    routes/health -> /health). Adding a route group is just adding a folder.
  fastify.register(autoload, {
    dir: join(import.meta.dirname, "routes"),
  });
}
