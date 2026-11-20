# @portfolio/realtime

Consumes domain events published by the core API and pushes them to connected clients.

- **Queue (BullMQ on Redis):** the API enqueues events on the `domain-events` queue; a worker here
  validates and handles them, with retries and exponential backoff.
- **Pub/Sub (Socket.IO Redis adapter):** a notification emitted on one instance reaches clients
  connected to *any* instance.
- **Expo push:** device tokens are registered per group; every notification is also sent as a push.

## Architecture

```
 core API ──enqueue──▶ Redis (BullMQ queue "domain-events")
                              │ job
                 ┌────────────┴────────────┐
                 ▼                         ▼
        realtime instance A       realtime instance B      (one worker gets each job)
        ┌───────────────────┐     ┌───────────────────┐
        │ DomainEventsProc. │     │ DomainEventsProc. │
        │  parseEvent (zod) │     │        ...        │
        │  HandleDomainEvent│     └───────────────────┘
        │   ├ claim id (SET NX, Redis)
        │   ├ NotificationPublisher ──▶ Socket.IO room "group:<id>"
        │   └ PushSender ──▶ Expo push API (best effort)
        └───────────────────┘
                 │ emit
                 ▼
        Redis Pub/Sub (@socket.io/redis-adapter) ──▶ every instance ──▶ its clients in the room
```

Layout (hexagonal, like `apps/api`): `domain/` notification type, `application/` ports +
use cases (`HandleDomainEvent`, `RegisterPushToken`), `infrastructure/` BullMQ processor,
Socket.IO gateway/adapters, Redis, Expo, HTTP.

## Contract

- Events: `@portfolio/events` (`packages/events`), zod-validated envelope
  `{ id, type, version: 1, occurredAt, groupId, payload }`. Publishers should enqueue with
  `EVENT_JOB_OPTIONS` (5 attempts, exponential backoff from 1s) and `jobId: event.id`.
- WebSocket: connect with `?groupId=<id>` (missing/blank → `exception` event, then disconnect) and
  listen for `notification`: `{ type, groupId, title, body, event }`.
- `POST /push-tokens` `{ groupId, token }` (an Expo push token) → `204`.
- `GET /health` → `{ status: "ok" | "degraded", redis: "up" | "down" }` (always HTTP 200).
- Env: `REDIS_URL` (required, e.g. `redis://localhost:6379`), `PORT` (default `3001`).

## Failure modes

| Situation | Behaviour |
| --- | --- |
| Redis down | Worker stops fetching jobs and keeps reconnecting (jobs stay safe in Redis, nothing is lost); commands fail fast after 3 attempts so in-flight jobs fail and are retried by BullMQ; `/health` says `degraded`; process stays up. Connected Socket.IO clients stay connected, but cross-instance delivery is paused. Everything resumes when Redis returns. |
| Websocket client drops | Socket.IO clients reconnect on their own (the client's default). Events emitted while a client is away are **not** replayed: fetch current state from the API after reconnecting. |
| Handler fails (e.g. publish throws) | The id claim is released and BullMQ retries (5 attempts, exponential backoff). |
| Duplicate / retried event | The event id is claimed with `SET NX` + 7-day TTL before notifying, so it is notified at most once. |
| Invalid event | `UnrecoverableError`: fails immediately, no retries, logged. |
| Expo push fails | Logged and ignored (the socket notification was already delivered; retrying would be a duplicate). |
| Worker crashes between claim and publish | That event is lost (claim stays, retry is skipped). Accepted trade-off of at-most-once over duplicates. |
| Pub/Sub relay | Redis Pub/Sub is fire-and-forget: an instance disconnected from Redis at emit time misses the message. |

Member names are not in the events yet, so notifications show member ids ("Ana added Dinner ($45.99)"
when the id is `Ana`).

## Run

```bash
docker compose up -d            # Redis on :6379
REDIS_URL=redis://localhost:6379 PORT=3001 pnpm dev   # watch mode
pnpm build && REDIS_URL=redis://localhost:6379 pnpm start
pnpm lint
pnpm test                       # unit + integration (integration needs Docker for Testcontainers)
```

`build`/`dev`/`test` first build `@portfolio/events` (CommonJS in `packages/events/dist`).
