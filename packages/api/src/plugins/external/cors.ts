import cors, { type FastifyCorsOptions } from "@fastify/cors";

// CORS for the Vite dev server (the dev proxy makes this redundant in practice).
// autoload reads `autoConfig` as the plugin's options and registers the default
// export with them.
//
// @see https://github.com/fastify/fastify-cors
export const autoConfig: FastifyCorsOptions = {
  origin: "http://localhost:5173",
};

export default cors;
