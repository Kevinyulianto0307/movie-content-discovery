# @mcd/web

[← Back to the root README](../../README.md)

The frontend. React 19 + Vite + TanStack Query + React Router — a lightweight
browse-and-detail UI over the API. Deliberately unstyled beyond plain CSS modules;
the focus is component structure, state management, API integration, and error
handling.

> How to start the UI alongside the API is in the
> [root README](../../README.md#starting-the-api). This file documents the package.

## Responsibilities

- Two routes: `/` (search + browse) and `/movies/:id` (detail with cast, crew,
  keywords, similar titles).
- Consume `/api/movies` and `/api/search`; render explicit loading, error, and empty
  states on every data view.
- Keep all HTTP in one typed client layer; keep all server state in TanStack Query.

## Directory structure

```
src/
  main.tsx       Router + QueryClientProvider bootstrap
  pages/         Home, MovieDetail, NotFound (render only)
  hooks/         presenter hooks that own state + derived data:
                 useMovieBrowse, useMovieDetail, useMovies, useMovie, useSearch,
                 useSimilarMovies, useDebounce
  api/           the only HTTP layer: http.ts, client.ts, *.client.ts, queryKeys.ts,
                 typed request/response types
  components/    MovieCard, MovieTable, SearchBar, Pagination, SortControl,
                 ViewToggle, StateMessage, Skeleton, ErrorBoundary, Layout
  lib/           date + format helpers
  constants/     shared constants (page sizes, debounce delay, …)
```

**Pattern:** pages render → presenter hooks own state → the typed API client is the
only place that talks HTTP. This keeps components passive and the data layer testable
in isolation.

## Environment variables

None. In development, `vite.config.ts` proxies `/api` → `http://localhost:3000`, so the
UI uses relative URLs and there's no CORS concern. The dev server runs on port `5173`.

## Commands

```bash
npm run web                              # from repo root — dev server on :5173
npm run -w @mcd/web dev                   # same thing, scoped
npm run -w @mcd/web build                 # production build
npm run -w @mcd/web preview               # preview the build
npm run -w @mcd/web test                  # unit + component + integration
npm run -w @mcd/web test:unit             # lib / hooks / api client
npm run -w @mcd/web test:component        # component + page tests
npm run -w @mcd/web test:integration      # page-level flows
npm run -w @mcd/web typecheck
npm run -w @mcd/web lint
```

## Testing

React Testing Library via Vitest, with MSW for HTTP mocking. Unit tests cover the typed
client, the debounce hook, and the formatters; component and integration tests assert
the loading/error/empty states and the browse → detail flows. Visual styling is
intentionally not asserted (see the
[root README test strategy](../../README.md#test-strategy)); the Playwright e2e suite
in [`/e2e`](../../e2e) smoke-tests the real browser path.

## Design notes

- **TanStack Query for all server state** — caching, dedup, background refresh, and
  loading/error states for free, with `keepPreviousData` for smooth pagination.
- **Presenter hooks** keep pages free of state logic, so the UI is a passive view over
  hook output — easy to test and reason about.
- **Plain CSS modules, no UI library** — reviewers can read the code without learning a
  framework's conventions. Trade-off acknowledged in [`ADR.md`](../../ADR.md) §5.
- **Vite dev proxy** removes CORS friction in development; CORS is still registered
  server-side for completeness.
