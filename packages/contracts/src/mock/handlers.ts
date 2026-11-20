import { http, HttpResponse } from 'msw';
import { mockStore, type ErrorResponse, type GroupResponse } from './store';

const MAX_NAME_LENGTH = 60;

// Same body shape the real API sends (see DomainExceptionFilter in apps/api).
function error(statusCode: number, errorName: string, message: string) {
  const body: ErrorResponse = { statusCode, error: errorName, message };
  return HttpResponse.json(body, { status: statusCode });
}

const notFound = (id: string) => error(404, 'Not Found', `Group "${id}" was not found`);

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
];

export { resetMockStore } from './store';
