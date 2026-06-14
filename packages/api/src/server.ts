import Fastify from "fastify";
import fp from "fastify-plugin";
import closeWithGrace from "close-with-grace";
import { pool, type Db } from "@mcd/db";
import serviceApp from "./app.ts";

export interface ServerOptions {
  // The database handle. Defaults to the shared @mcd/db client; tests inject a
  // stub here to exercise routes without (or against a failing) database.
  db?: Db;
}

// Runtime layer: create the Fastify instance (logging config) and mount the
// application plugin from app.ts. Returns the instance *without* listening —
// index.ts calls listen() for the real server, and tests call .inject().
//
// The app is wrapped in fp() so its error handler, compilers and decorators apply
// to this root instance rather than being trapped in an encapsulated child scope.
export function buildServer(options: ServerOptions = {}) {
  const app = Fastify({
    logger:
      process.env.NODE_ENV === "test"
        ? false
        : {
            level: process.env.LOG_LEVEL ?? "info",
            transport: {
              target: "pino-pretty",
              options: { translateTime: "HH:MM:ss Z", ignore: "pid,hostname" },
            },
          },
    // Apply recommended timeouts to prevent slow or idle clients from holding connections open
    connectionTimeout: 120_000,
    requestTimeout: 60_000,
    keepAliveTimeout: 10_000,
  });

  app.register(fp(serviceApp), { db: options.db });

  // Graceful shutdown — only for a real running process. Tests drive the app with
  // .inject() and call buildServer() many times; installing process-level signal
  // handlers there would leak listeners and could close the shared pool mid-suite.
  if (process.env.NODE_ENV !== "test") {
    closeWithGrace(
      // delay (ms) for in-flight requests to drain. env vars are strings, so coerce;
      // falls back to 500 when unset or non-numeric.
      { delay: Number(process.env.FASTIFY_CLOSE_GRACE_DELAY) || 500 },
      async ({ err }) => {
        if (err != null) {
          app.log.error(err);
        }
        await app.close(); // stop accepting requests, run onClose hooks
        await pool.end(); // close the shared pg connection pool
      },
    );
  }

  return app;
}
