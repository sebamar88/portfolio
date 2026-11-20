import type { components } from '../schema';

export type GroupResponse = components['schemas']['GroupResponse'];
export type ErrorResponse = components['schemas']['ErrorResponse'];

// Typed from the generated schema: if the API changes a field, this file stops compiling.
const groups = new Map<string, GroupResponse>();

export const mockStore = {
  find: (id: string) => groups.get(id),
  save: (group: GroupResponse) => void groups.set(group.id, group),
};

// Call it between tests so one test never sees another's data.
export function resetMockStore(): void {
  groups.clear();
}
