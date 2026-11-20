import { RedisContainer } from '@testcontainers/redis';
import type { StartedRedisContainer } from '@testcontainers/redis';
import type { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { DomainEvent } from '@portfolio/events';
import { fakeEvent } from '../support/fakes';
import {
  connectClient,
  eventsQueue,
  sleep,
  startInstance,
  waitFor,
} from '../support/harness';
import type { Instance } from '../support/harness';

// Fast retries for tests; production uses EVENT_JOB_OPTIONS (5 attempts, exponential from 1s).
const FAST_RETRY = { attempts: 5, backoff: { type: 'exponential', delay: 20 } };

describe('realtime service (Redis via Testcontainers)', () => {
  let container: StartedRedisContainer;
  let redisUrl: string;
  let queue: Queue;
  let admin: Redis;
  const instances: Instance[] = [];
  const sockets: { close(): void }[] = [];

  const enqueue = (event: DomainEvent, opts: object = FAST_RETRY) =>
    queue.add(event.type, event, { jobId: event.id, ...opts });

  beforeAll(async () => {
    container = await new RedisContainer('redis:7-alpine').start();
    redisUrl = container.getConnectionUrl();
    queue = eventsQueue(redisUrl);
    admin = new Redis(redisUrl);
  });

  afterEach(async () => {
    sockets.splice(0).forEach((s) => s.close());
    await Promise.all(instances.splice(0).map((i) => i.app.close()));
    await queue.obliterate({ force: true });
    await admin.flushall();
  });

  afterAll(async () => {
    await queue.close();
    await admin.quit();
    await container.stop();
  });

  async function client(instance: Instance, groupId: string | undefined) {
    const c = await connectClient(instance.url, groupId);
    sockets.push(c.socket);
    await sleep(100); // let the server finish joining the room
    return c;
  }

  async function start(options?: { failFirstPublishes?: number }) {
    const instance = await startInstance(redisUrl, options);
    instances.push(instance);
    return instance;
  }

  it('delivers a queued event to a connected websocket client of its group only', async () => {
    const instance = await start();
    const inGroup = await client(instance, 'g1');
    const otherGroup = await client(instance, 'g2');

    const event = fakeEvent('expense.added');
    await enqueue(event);

    await waitFor(() => inGroup.received.length > 0);
    await sleep(300);
    expect(inGroup.received).toEqual([
      { type: 'expense.added', groupId: 'g1', title: 'New expense', body: 'Ana added Dinner ($45.99)', event },
    ]);
    expect(otherGroup.received).toEqual([]);
  });

  it('rejects a websocket connection without a groupId', async () => {
    const instance = await start();
    const { socket } = await connectClient(instance.url, undefined);
    sockets.push(socket);
    await waitFor(() => socket.disconnected);
    expect(socket.connected).toBe(false);
  });

  it('delivers across instances through the Redis adapter', async () => {
    const a = await start();
    const b = await start();
    expect(a.url).not.toBe(b.url);
    const clientA = await client(a, 'g1');
    const clientB = await client(b, 'g1');

    await enqueue(fakeEvent('expense.added'));

    await waitFor(() => clientA.received.length > 0 && clientB.received.length > 0);
    await sleep(300);
    // Exactly one worker took the job, yet BOTH clients got it: the one connected to the other
    // instance was served over Redis Pub/Sub.
    expect(a.published.length + b.published.length).toBe(1);
    expect(clientA.received).toHaveLength(1);
    expect(clientB.received).toHaveLength(1);
    const processedByA = a.published.length === 1;
    const remoteClient = processedByA ? clientB : clientA;
    expect(remoteClient.received[0]?.body).toBe('Ana added Dinner ($45.99)');
  });

  it('retries a failing publish and delivers exactly once', async () => {
    const instance = await start({ failFirstPublishes: 2 });
    const c = await client(instance, 'g1');

    await enqueue(fakeEvent('expense.added'));

    await waitFor(() => c.received.length > 0);
    await sleep(500);
    expect(c.received).toHaveLength(1);
    expect(instance.attempts.count).toBe(3);
    expect(instance.published).toHaveLength(1);
  });

  it('ignores a second job carrying an already processed event id', async () => {
    const instance = await start();
    const c = await client(instance, 'g1');
    const event = fakeEvent('expense.added');

    await enqueue(event);
    await waitFor(() => c.received.length === 1);
    // Same event id, different job id (e.g. the publisher enqueued it twice).
    await queue.add(event.type, event, { jobId: 'duplicate-job', ...FAST_RETRY });
    await waitFor(async () => (await queue.getCompletedCount()) === 2);
    await sleep(300);

    expect(c.received).toHaveLength(1);
    expect(instance.attempts.count).toBe(1);
  });

  it('fails an invalid event permanently, without retries', async () => {
    const instance = await start();
    const job = await queue.add('bad', { type: 'nope' }, { jobId: 'bad-job', ...FAST_RETRY });

    await waitFor(async () => (await job.getState()) === 'failed');
    const failed = await queue.getJob('bad-job');
    expect(failed?.attemptsMade).toBe(1); // 5 attempts were allowed; none were spent on retries
    expect(failed?.failedReason).toContain('Invalid domain event');
    expect(instance.attempts.count).toBe(0);
  });

  it('GET /health reports redis up', async () => {
    const instance = await start();
    const res = await request(instance.app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', redis: 'up' });
  });

  it('POST /push-tokens stores the token in a Redis set for the group', async () => {
    const instance = await start();
    const http = request(instance.app.getHttpServer());
    await http.post('/push-tokens').send({ groupId: 'g1', token: 'ExponentPushToken[abc]' }).expect(204);
    await http.post('/push-tokens').send({ groupId: 'g1', token: 'ExponentPushToken[abc]' }).expect(204);
    expect(await admin.smembers('realtime:push-tokens:g1')).toEqual(['ExponentPushToken[abc]']);
  });

  it.each([
    [{ groupId: '', token: 'ExponentPushToken[abc]' }],
    [{ groupId: 'g1', token: 'not-a-token' }],
    [{ groupId: 'g1', token: 'ExponentPushToken[abc]', extra: 1 }],
    [{}],
  ])('POST /push-tokens rejects invalid body %j', async (body) => {
    const instance = await start();
    await request(instance.app.getHttpServer()).post('/push-tokens').send(body).expect(400);
    expect(await admin.keys('realtime:push-tokens:*')).toEqual([]);
  });
});
