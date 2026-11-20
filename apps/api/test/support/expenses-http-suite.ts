import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

/**
 * The HTTP behavior of expenses, balances and settlements. Both e2e files (in-memory and real
 * Postgres) run it, so the two adapters are held to the same responses. Every test makes its own
 * group, so no cleanup is needed between them.
 */
export function expensesHttpSuite(name: string, getApp: () => INestApplication) {
  const http = () => request(getApp().getHttpServer());

  async function groupWith(...members: string[]): Promise<string> {
    const { body } = await http().post('/groups').send({ name: 'Trip' }).expect(201);
    for (const memberId of members) await http().post(`/groups/${body.id}/members`).send({ memberId }).expect(201);
    return body.id;
  }

  const addExpense = (groupId: string, body: Record<string, unknown>) =>
    http()
      .post(`/groups/${groupId}/expenses`)
      .send({ description: 'Dinner', amount: '30.00', payerId: 'ana', paidAt: '2026-05-20', ...body });

  describe(`expenses (${name})`, () => {
    it('POST /groups/:id/expenses creates an expense with integer cents and currency', async () => {
      const id = await groupWith('ana', 'bruno', 'carla');
      const res = await addExpense(id, { description: '  Dinner  ', amount: '10.00' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
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
        createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
      });
    });

    it('POST honors participantIds', async () => {
      const id = await groupWith('ana', 'bruno', 'carla');
      const res = await addExpense(id, { participantIds: ['bruno', 'carla'] });
      expect(res.status).toBe(201);
      expect(res.body.shares).toEqual([
        { memberId: 'bruno', amount: 1500 },
        { memberId: 'carla', amount: 1500 },
      ]);
    });

    it('POST returns 404 for an unknown group', async () => {
      const res = await addExpense('nope', {});
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ statusCode: 404, error: 'Not Found', message: 'Group "nope" was not found' });
    });

    it('POST returns 400 for a payer or participant outside the group', async () => {
      const id = await groupWith('ana', 'bruno');
      const payer = await addExpense(id, { payerId: 'zed' });
      expect(payer.status).toBe(400);
      expect(payer.body.message).toBe('"zed" is not a member of this group');
      await addExpense(id, { participantIds: ['ana', 'zed'] }).expect(400);
    });

    it.each([
      ['a negative amount', { amount: '-5.00' }],
      ['a non-numeric amount', { amount: 'abc' }],
      ['an amount with 3 decimals', { amount: '1.234' }],
      ['a numeric (non-string) amount', { amount: 12.5 }],
      ['a blank description', { description: '   ' }],
      ['a too long description', { description: 'x'.repeat(121) }],
      ['an impossible date', { paidAt: '2026-02-30' }],
      ['a malformed date', { paidAt: '20/05/2026' }],
      ['empty participants', { participantIds: [] }],
      ['duplicate participants', { participantIds: ['ana', 'ana'] }],
      ['an unknown field', { admin: true }],
    ])('POST returns 400 for %s and stores nothing', async (_label, override) => {
      const id = await groupWith('ana', 'bruno');
      await addExpense(id, override).expect(400);
      const list = await http().get(`/groups/${id}/expenses`).expect(200);
      expect(list.body).toEqual({ items: [], nextCursor: null });
    });

    it('GET /groups/:id/expenses lists newest first', async () => {
      const id = await groupWith('ana');
      await addExpense(id, { description: 'old', paidAt: '2026-05-01' });
      await addExpense(id, { description: 'new', paidAt: '2026-05-09' });

      const res = await http().get(`/groups/${id}/expenses`).expect(200);
      expect(res.body.items.map((e: { description: string }) => e.description)).toEqual(['new', 'old']);
      expect(res.body.nextCursor).toBeNull();
    });

    it('GET paginates with limit and cursor, visiting every expense once', async () => {
      const id = await groupWith('ana');
      for (const day of ['01', '02', '03', '04', '05']) await addExpense(id, { description: `d${day}`, paidAt: `2026-05-${day}` });

      const seen: string[] = [];
      let cursor: string | null = null;
      let pages = 0;
      do {
        const res: request.Response = await http()
          .get(`/groups/${id}/expenses`)
          .query({ limit: 2, ...(cursor ? { cursor } : {}) })
          .expect(200);
        seen.push(...res.body.items.map((e: { description: string }) => e.description));
        cursor = res.body.nextCursor;
        pages++;
      } while (cursor && pages < 10);

      expect(seen).toEqual(['d05', 'd04', 'd03', 'd02', 'd01']);
      expect(pages).toBe(3);
    });

    it.each(['0', '101', 'abc', '1.5'])('GET returns 400 for limit=%s', async (limit) => {
      const id = await groupWith('ana');
      await http().get(`/groups/${id}/expenses`).query({ limit }).expect(400);
    });

    it('GET returns 400 for a malformed cursor', async () => {
      const id = await groupWith('ana');
      await http().get(`/groups/${id}/expenses`).query({ cursor: 'garbage' }).expect(400);
    });

    it('GET returns 404 for an unknown group', async () => {
      await http().get('/groups/nope/expenses').expect(404);
    });
  });

  describe(`balances and settlements (${name})`, () => {
    it('GET balances lists every member with 0 when there are no expenses, in member order', async () => {
      const id = await groupWith('carla', 'ana');
      const res = await http().get(`/groups/${id}/balances`).expect(200);
      expect(res.body).toEqual({
        currency: 'USD',
        balances: [
          { memberId: 'carla', amount: 0 },
          { memberId: 'ana', amount: 0 },
        ],
      });
    });

    it('GET balances and settlements reflect the expenses', async () => {
      const id = await groupWith('ana', 'bruno', 'carla');
      await addExpense(id, { amount: '30.00' }).expect(201);

      const balances = await http().get(`/groups/${id}/balances`).expect(200);
      expect(balances.body).toEqual({
        currency: 'USD',
        balances: [
          { memberId: 'ana', amount: 2000 },
          { memberId: 'bruno', amount: -1000 },
          { memberId: 'carla', amount: -1000 },
        ],
      });

      const settlements = await http().get(`/groups/${id}/settlements`).expect(200);
      expect(settlements.body).toEqual({
        currency: 'USD',
        transfers: [
          { from: 'bruno', to: 'ana', amount: 1000 },
          { from: 'carla', to: 'ana', amount: 1000 },
        ],
      });
    });

    it('GET settlements has no transfers for a group without expenses', async () => {
      const id = await groupWith('ana');
      const res = await http().get(`/groups/${id}/settlements`).expect(200);
      expect(res.body).toEqual({ currency: 'USD', transfers: [] });
    });

    it('GET balances and settlements return 404 for an unknown group', async () => {
      await http().get('/groups/nope/balances').expect(404);
      await http().get('/groups/nope/settlements').expect(404);
    });
  });
}
