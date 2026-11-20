import { http, HttpResponse } from 'msw';
import {
  computeBalances,
  decodeCursor,
  encodeCursor,
  newestFirst,
  parseAmount,
  RuleError,
  settleDebts,
  splitEqually,
  validateDescription,
  validatePaidAt,
} from './ledger';
import { mockStore, type ErrorResponse, type ExpenseResponse, type GroupResponse } from './store';

const MAX_NAME_LENGTH = 60;

// Same body shape the real API sends (see DomainExceptionFilter in apps/api).
function error(statusCode: number, errorName: string, message: string) {
  const body: ErrorResponse = { statusCode, error: errorName, message };
  return HttpResponse.json(body, { status: statusCode });
}

const notFound = (id: string) => error(404, 'Not Found', `Group "${id}" was not found`);

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const badRequest = (message: string) => error(400, 'Bad Request', message);

// Paths start with `*` so the handlers match whatever base URL the consumer's client uses.
// These are hand-written mirrors of the API rules; the contract tests keep them honest.
export const handlers = [
  http.post('*/groups', async ({ request }) => {
    const { name } = (await request.json()) as { name: string };
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) {
      return error(400, 'Bad Request', `A group name must have 1 to ${MAX_NAME_LENGTH} characters`);
    }
    const group: GroupResponse = { id: crypto.randomUUID(), name: trimmed, memberIds: [] };
    mockStore.save(group);
    return HttpResponse.json(group, { status: 201 });
  }),

  http.get('*/groups/:id', ({ params }) => {
    const group = mockStore.find(String(params.id));
    if (!group) return notFound(String(params.id));
    return HttpResponse.json(group);
  }),

  http.post('*/groups/:id/members', async ({ params, request }) => {
    const group = mockStore.find(String(params.id));
    if (!group) return notFound(String(params.id));
    const { memberId } = (await request.json()) as { memberId: string };
    if (memberId.length === 0) return error(400, 'Bad Request', 'memberId should not be empty');
    if (group.memberIds.includes(memberId)) {
      return error(409, 'Conflict', `"${memberId}" is already a member of this group`);
    }
    const updated: GroupResponse = { ...group, memberIds: [...group.memberIds, memberId] };
    mockStore.save(updated);
    return HttpResponse.json(updated, { status: 201 });
  }),

  http.post('*/groups/:id/expenses', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const { description, amount, payerId, participantIds, paidAt } = body;
    // Shape checks first, like the API's ValidationPipe (unknown fields are rejected too).
    const allowed = ['description', 'amount', 'payerId', 'participantIds', 'paidAt'];
    const shapeOk =
      Object.keys(body).every((key) => allowed.includes(key)) &&
      typeof description === 'string' &&
      typeof amount === 'string' &&
      typeof payerId === 'string' &&
      payerId.length > 0 &&
      typeof paidAt === 'string' &&
      (participantIds === undefined || (Array.isArray(participantIds) && participantIds.every((id) => typeof id === 'string')));
    if (!shapeOk) return badRequest('Invalid request body');

    try {
      // The API parses the amount before it looks the group up, so a bad amount wins over a 404.
      const cents = parseAmount(amount);
      const group = mockStore.find(String(params.id));
      if (!group) return notFound(String(params.id));

      const participants = (participantIds as string[] | undefined) ?? group.memberIds;
      for (const memberId of [payerId, ...participants]) {
        if (!group.memberIds.includes(memberId)) return badRequest(`"${memberId}" is not a member of this group`);
      }
      const shares = splitEqually(cents, participants);
      const expense: ExpenseResponse = {
        id: crypto.randomUUID(),
        groupId: group.id,
        description: validateDescription(description),
        amount: cents,
        currency: 'USD',
        payerId,
        shares,
        paidAt: validatePaidAt(paidAt),
        createdAt: new Date().toISOString(),
      };
      mockStore.addExpense(expense);
      return HttpResponse.json(expense, { status: 201 });
    } catch (e) {
      if (e instanceof RuleError) return badRequest(e.message);
      throw e;
    }
  }),

  http.get('*/groups/:id/expenses', ({ params, request }) => {
    const url = new URL(request.url);
    const limitText = url.searchParams.get('limit');
    const cursorText = url.searchParams.get('cursor');
    const limit = limitText === null ? DEFAULT_LIMIT : Number(limitText);
    if (limitText === '' || !Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return badRequest(`limit must be a whole number from 1 to ${MAX_LIMIT}`);
    }
    try {
      const after = cursorText === null ? undefined : decodeCursor(cursorText);
      if (!mockStore.find(String(params.id))) return notFound(String(params.id));

      const sorted = [...mockStore.expensesOf(String(params.id))].sort(newestFirst);
      const candidates = sorted.filter((e) => !after || newestFirst(e, after) > 0);
      const items = candidates.slice(0, limit);
      const last = items.at(-1);
      const nextCursor = candidates.length > limit && last ? encodeCursor(last) : null;
      return HttpResponse.json({ items, nextCursor });
    } catch (e) {
      if (e instanceof RuleError) return badRequest(e.message);
      throw e;
    }
  }),

  http.get('*/groups/:id/balances', ({ params }) => {
    const group = mockStore.find(String(params.id));
    if (!group) return notFound(String(params.id));
    const balances = computeBalances(mockStore.expensesOf(group.id));
    // Every member appears, in the order they joined, even with nothing owed.
    return HttpResponse.json({
      currency: 'USD' as const,
      balances: group.memberIds.map((memberId) => ({ memberId, amount: balances[memberId] ?? 0 })),
    });
  }),

  http.get('*/groups/:id/settlements', ({ params }) => {
    const group = mockStore.find(String(params.id));
    if (!group) return notFound(String(params.id));
    const transfers = settleDebts(computeBalances(mockStore.expensesOf(group.id)));
    return HttpResponse.json({ currency: 'USD' as const, transfers });
  }),
];

export { resetMockStore } from './store';
