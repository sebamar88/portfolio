# @portfolio/api

Module 2 of the portfolio: the Core API, built with NestJS. This is **slice 0 of 14**: a bare app
with a single `GET /health` endpoint, plus tests and CI.

```sh
pnpm --filter @portfolio/api dev     # watch mode on http://localhost:3000 (PORT to change)
pnpm --filter @portfolio/api test    # e2e tests (Vitest + supertest)
pnpm --filter @portfolio/api build   # type check + SWC build into dist/
pnpm --filter @portfolio/api start   # run the built app
```

**CommonJS on purpose.** `package.json` has no `"type"` and `tsconfig.json` uses `nodenext`, so Node
treats the output as CommonJS: Nest and SWC work without `.js` suffixes on every import.

**Decorator metadata.** Nest's dependency injection reads constructor parameter types at runtime,
from metadata the compiler emits for decorators. `nest build` emits it with SWC (`.swcrc`); tests
emit it with Vite's Oxc transform (`oxc.decorator` in `vitest.config.mts`).
`test/decorator-metadata.test.ts` fails if that setting breaks.
