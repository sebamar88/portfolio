import { describe, expect, it } from 'vitest';
import { EXPO_PUSH_URL, ExpoPushSender } from '../../src/infrastructure/push/expo-push-sender';
import { fakeEvent, notificationFor } from '../support/fakes';

function fakeFetch(respond: (body: unknown[]) => Response) {
  const calls: { url: string; init: RequestInit; body: unknown[] }[] = [];
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as unknown[];
    calls.push({ url: String(url), init: init ?? {}, body });
    return respond(body);
  }) as typeof fetch;
  return { fn, calls };
}
const ok = (body: unknown[]) =>
  new Response(JSON.stringify({ data: body.map(() => ({ status: 'ok' })) }), { status: 200 });

describe('ExpoPushSender', () => {
  const notification = notificationFor(fakeEvent('expense.added'));

  it('POSTs one message per token to the Expo push API', async () => {
    const { fn, calls } = fakeFetch(ok);
    await new ExpoPushSender(fn, { warn() {} }).send(['ExponentPushToken[a]', 'ExponentPushToken[b]'], notification);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(EXPO_PUSH_URL);
    expect(calls[0]?.init.method).toBe('POST');
    expect(calls[0]?.body).toEqual([
      { to: 'ExponentPushToken[a]', title: notification.title, body: notification.body, data: { type: 'expense.added', groupId: 'g1', eventId: notification.event.id } },
      { to: 'ExponentPushToken[b]', title: notification.title, body: notification.body, data: { type: 'expense.added', groupId: 'g1', eventId: notification.event.id } },
    ]);
  });

  it('splits more than 100 tokens into several requests', async () => {
    const { fn, calls } = fakeFetch(ok);
    const tokens = Array.from({ length: 250 }, (_, i) => `ExponentPushToken[${i}]`);
    await new ExpoPushSender(fn, { warn() {} }).send(tokens, notification);
    expect(calls.map((c) => c.body.length)).toEqual([100, 100, 50]);
  });

  it('throws when Expo answers with an HTTP error', async () => {
    const { fn } = fakeFetch(() => new Response('nope', { status: 500 }));
    await expect(new ExpoPushSender(fn, { warn() {} }).send(['ExponentPushToken[a]'], notification)).rejects.toThrow(/500/);
  });

  it('logs per-token errors reported in the response tickets', async () => {
    const warnings: string[] = [];
    const { fn } = fakeFetch(() =>
      new Response(JSON.stringify({ data: [{ status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } }] }), { status: 200 }),
    );
    await new ExpoPushSender(fn, { warn: (m) => warnings.push(m) }).send(['ExponentPushToken[a]'], notification);
    expect(warnings[0]).toContain('DeviceNotRegistered');
  });

  it('does nothing for an empty token list', async () => {
    const { fn, calls } = fakeFetch(ok);
    await new ExpoPushSender(fn, { warn() {} }).send([], notification);
    expect(calls).toEqual([]);
  });
});
