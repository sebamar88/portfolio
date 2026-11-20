# Portfolio — a shared-expenses app in 8 modules

One product (a Splitwise-like shared-expenses app) built as eight modules. Each module is part of the
whole and also stands alone: it runs, deploys and can be demoed by itself. Together they cover
frontend, backend, real-time, mobile, crypto and AI.

**Site:** [sebamar88.github.io/portfolio](https://sebamar88.github.io/portfolio/)

## Module map

| # | Module | Path | Stack | Status | Links |
|---|--------|------|-------|--------|-------|
| 1 | Design system | `packages/design-system` | React, SCSS Modules, Storybook | Done | [Storybook](https://sebamar88.github.io/portfolio/design-system/) · [README](packages/design-system/README.md) |
| 2 | Contracts + Core API | `packages/contracts`, `apps/api` | NestJS, Postgres, Redis | In progress | [Contracts](packages/contracts/README.md) |
| 3 | FX dashboard | `apps/dashboard` | Vite, React, TanStack | Planned | — |
| 4 | Web app | `apps/web` | Next.js App Router | Planned | — |
| 5 | Real-time | `apps/realtime` | NestJS, BullMQ, websockets | Planned | — |
| 6 | Mobile | `apps/mobile` | Expo | Planned | — |
| 7 | On-chain settlement | `apps/chain` | Solidity, Foundry, wagmi/viem | Planned | — |
| 8 | AI assistant | `apps/assistant` | LLM API | Planned | — |

## Layout

```
packages/   shared libraries (design-system, later contracts)
apps/       deployable modules (added as they are built)
.github/    CI and the GitHub Pages landing page
```

pnpm workspace at the root, a single `pnpm-lock.yaml`.

## Running

Requires Node >= 24 and pnpm 12.4.1.

```sh
pnpm install                 # once, at the root
pnpm lint | test | build     # run in every module that defines the script
pnpm ds storybook            # per-module: pnpm --filter @portfolio/design-system <script>
pnpm ds test:visual          # screenshot tests (needs Docker)
```

## Contract-first, mock-first

_The plan for module 2 onwards; not built yet._ The Core API will generate an OpenAPI spec that is
committed to `packages/contracts`, together with generated types, a typed client and a mock server.
Other modules depend only on the contracts, never on API internals, so each runs against the mock
until the real API exists. CI will fail if the committed contract differs from what the code generates.
