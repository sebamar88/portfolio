# @portfolio/api

Module 2 of the portfolio: the Core API, built with NestJS. This is **slice 0 of 14**: a bare app
with a single `GET /health` endpoint, plus tests and CI.

```sh
pnpm --filter @portfolio/api dev     # watch mode on http://localhost:3000 (PORT to change)
pnpm --filter @portfolio/api test    # e2e tests (Vitest + supertest)
pnpm --filter @portfolio/api build   # type check + SWC build into dist/
pnpm --filter @portfolio/api start   # run the built app
```

CommonJS on purpose: Nest + SWC + Vitest work without `.js` import suffixes. Vitest uses SWC (not
esbuild) because Nest's DI needs decorator metadata.
