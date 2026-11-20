import { afterAll, afterEach, beforeAll, describe, expect, expectTypeOf, it } from 'vitest';
import { createApiClient } from '../src/client';
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
