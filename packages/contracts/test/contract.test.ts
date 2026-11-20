import { afterAll, afterEach, beforeAll, describe, expect, expectTypeOf, it } from 'vitest';
import { createApiClient } from '../src/client';
import type { components } from '../src/schema';
import { resetMockStore } from '../src/mock/handlers';
import { server } from '../src/mock/node';

const client = createApiClient('http://api.test');

// 'error' makes a request with no handler fail the test instead of reaching the network.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => resetMockStore());
afterAll(() => server.close());

// The real generated client talks to the mock handlers: if the mock drifts from the contract
// types, or from the API rules, one of these breaks.
describe('contract client against the mock', () => {
  it('creates a group, reads it back and adds a member', async () => {
    const created = await client.POST('/groups', { body: { name: '  Trip  ' } });
    expect(created.response.status).toBe(201);
    expect(created.data).toEqual({ id: expect.any(String), name: 'Trip', memberIds: [] });

    const id = created.data!.id;
    const read = await client.GET('/groups/{id}', { params: { path: { id } } });
    expect(read.data).toEqual(created.data);

    const added = await client.POST('/groups/{id}/members', {
      params: { path: { id } },
      body: { memberId: 'ana' },
    });
    expect(added.response.status).toBe(201);
    expect(added.data?.memberIds).toEqual(['ana']);
  });

  it('answers 409 for a duplicate member', async () => {
    const { data } = await client.POST('/groups', { body: { name: 'Trip' } });
    const request = { params: { path: { id: data!.id } }, body: { memberId: 'ana' } };
    await client.POST('/groups/{id}/members', request);
    const duplicate = await client.POST('/groups/{id}/members', request);
    expect(duplicate.response.status).toBe(409);
    expect(duplicate.error?.statusCode).toBe(409);
  });

  it('answers 404 for an unknown group', async () => {
    const res = await client.GET('/groups/{id}', { params: { path: { id: 'nope' } } });
    expect(res.response.status).toBe(404);
    expect(res.error?.error).toBe('Not Found');
  });

  it('answers 404 when adding a member to an unknown group', async () => {
    const res = await client.POST('/groups/{id}/members', {
      params: { path: { id: 'nope' } },
      body: { memberId: 'ana' },
    });
    expect(res.response.status).toBe(404);
  });

  it.each(['   ', 'x'.repeat(61)])('answers 400 for the invalid name %j', async (name) => {
    const res = await client.POST('/groups', { body: { name } });
    expect(res.response.status).toBe(400);
  });

  it('rejects fields that are not in the contract at compile time', async () => {
    const { data } = await client.POST('/groups', { body: { name: 'Trip' } });
    // @ts-expect-error `members` is not in GroupResponse; this line fails to compile if it ever is
    void data?.members;
    expectTypeOf(data!.memberIds).toEqualTypeOf<string[]>();
  });
});

describe('expenses, balances and settlements against the mock', () => {
  async function groupWith(...members: string[]) {
    const { data } = await client.POST('/groups', { body: { name: 'Trip' } });
    const id = data!.id;
    for (const memberId of members) {
      await client.POST('/groups/{id}/members', { params: { path: { id } }, body: { memberId } });
    }
    return id;
  }

  const add = (id: string, body: Partial<components['schemas']['AddExpenseDto']> = {}) =>
    client.POST('/groups/{id}/expenses', {
      params: { path: { id } },
      body: { description: 'Dinner', amount: '10.00', payerId: 'ana', paidAt: '2026-05-20', ...body },
    });

  it('adds an expense with integer cents, currency and an equal split', async () => {
    const id = await groupWith('ana', 'bruno', 'carla');
    const res = await add(id, { description: '  Dinner  ' });

    expect(res.response.status).toBe(201);
    expect(res.data).toEqual({
      id: expect.any(String),
      groupId: id,
      description: 'Dinner',
      amount: 1000,
      currency: 'USD',
      payerId: 'ana',
      shares: [
        { memberId: 'ana', amount: 334 },
        { memberId: 'bruno', amount: 333 },
        { memberId: 'carla', amount: 333 },
      ],
      paidAt: '2026-05-20',
      createdAt: expect.any(String),
    });
  });

  it('splits only between the given participants', async () => {
    const id = await groupWith('ana', 'bruno', 'carla');
    const res = await add(id, { participantIds: ['bruno', 'carla'] });
    expect(res.data?.shares).toEqual([
      { memberId: 'bruno', amount: 500 },
      { memberId: 'carla', amount: 500 },
    ]);
  });

  it.each([
    ['a negative amount', { amount: '-1.00' }],
    ['3 decimals', { amount: '1.234' }],
    ['a blank description', { description: '  ' }],
    ['an impossible date', { paidAt: '2026-02-30' }],
    ['a payer outside the group', { payerId: 'zed' }],
    ['a participant outside the group', { participantIds: ['ana', 'zed'] }],
    ['empty participants', { participantIds: [] }],
    ['duplicate participants', { participantIds: ['ana', 'ana'] }],
  ])('answers 400 for %s', async (_label, override) => {
    const id = await groupWith('ana', 'bruno');
    const res = await add(id, override);
    expect(res.response.status).toBe(400);
    const list = await client.GET('/groups/{id}/expenses', { params: { path: { id } } });
    expect(list.data).toEqual({ items: [], nextCursor: null });
  });

  it('answers 404 when adding an expense to an unknown group', async () => {
    expect((await add('nope')).response.status).toBe(404);
  });

  it('lists newest first and pages with an opaque cursor', async () => {
    const id = await groupWith('ana');
    for (const day of ['01', '02', '03', '04', '05']) await add(id, { description: `d${day}`, paidAt: `2026-05-${day}` });

    const first = await client.GET('/groups/{id}/expenses', { params: { path: { id }, query: { limit: 2 } } });
    expect(first.data?.items.map((e) => e.description)).toEqual(['d05', 'd04']);
    expect(first.data?.nextCursor).toEqual(expect.any(String));

    const second = await client.GET('/groups/{id}/expenses', {
      params: { path: { id }, query: { limit: 2, cursor: first.data!.nextCursor! } },
    });
    expect(second.data?.items.map((e) => e.description)).toEqual(['d03', 'd02']);

    const third = await client.GET('/groups/{id}/expenses', {
      params: { path: { id }, query: { limit: 2, cursor: second.data!.nextCursor! } },
    });
    expect(third.data?.items.map((e) => e.description)).toEqual(['d01']);
    expect(third.data?.nextCursor).toBeNull();
  });

  it('answers 400 for a bad limit or cursor and 404 for an unknown group', async () => {
    const id = await groupWith('ana');
    const bad = (query: { limit?: number; cursor?: string }) =>
      client.GET('/groups/{id}/expenses', { params: { path: { id }, query } });
    expect((await bad({ limit: 0 })).response.status).toBe(400);
    expect((await bad({ limit: 101 })).response.status).toBe(400);
    expect((await bad({ cursor: 'garbage' })).response.status).toBe(400);
    const unknown = await client.GET('/groups/{id}/expenses', { params: { path: { id: 'nope' } } });
    expect(unknown.response.status).toBe(404);
  });

  it('lists every member with 0 balance when there are no expenses, in member order', async () => {
    const id = await groupWith('carla', 'ana');
    const res = await client.GET('/groups/{id}/balances', { params: { path: { id } } });
    expect(res.data).toEqual({
      currency: 'USD',
      balances: [
        { memberId: 'carla', amount: 0 },
        { memberId: 'ana', amount: 0 },
      ],
    });
  });

  it('computes balances and settlements from the expenses', async () => {
    const id = await groupWith('ana', 'bruno', 'carla');
    await add(id, { amount: '30.00' });

    const balances = await client.GET('/groups/{id}/balances', { params: { path: { id } } });
    expect(balances.data?.balances).toEqual([
      { memberId: 'ana', amount: 2000 },
      { memberId: 'bruno', amount: -1000 },
      { memberId: 'carla', amount: -1000 },
    ]);

    const settlements = await client.GET('/groups/{id}/settlements', { params: { path: { id } } });
    expect(settlements.data).toEqual({
      currency: 'USD',
      transfers: [
        { from: 'bruno', to: 'ana', amount: 1000 },
        { from: 'carla', to: 'ana', amount: 1000 },
      ],
    });
  });

  it('answers 404 for balances and settlements of an unknown group', async () => {
    const path = { params: { path: { id: 'nope' } } };
    expect((await client.GET('/groups/{id}/balances', path)).response.status).toBe(404);
    expect((await client.GET('/groups/{id}/settlements', path)).response.status).toBe(404);
  });
});
