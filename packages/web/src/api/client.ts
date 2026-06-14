// Typed API client, split by domain (http transport + movies + search). Kept
// behind this barrel so hooks and components import from a single `../api/client`
// path regardless of which domain a call belongs to.
export * from './http.js';
export * from './movies.client.js';
export * from './search.client.js';
