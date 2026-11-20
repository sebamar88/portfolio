import type { components } from '../schema';

export type GroupResponse = components['schemas']['GroupResponse'];
export type ErrorResponse = components['schemas']['ErrorResponse'];
export type ExpenseResponse = components['schemas']['ExpenseResponse'];

// Typed from the generated schema: if the API changes a field, this file stops compiling.
const groups = new Map<string, GroupResponse>();
const expenses = new Map<string, ExpenseResponse[]>();

export const mockStore = {
  find: (id: string) => groups.get(id),
  save: (group: GroupResponse) => void groups.set(group.id, group),
  expensesOf: (groupId: string): ExpenseResponse[] => expenses.get(groupId) ?? [],
  addExpense: (expense: ExpenseResponse) =>
    void expenses.set(expense.groupId, [...(expenses.get(expense.groupId) ?? []), expense]),
};

// Call it between tests so one test never sees another's data.
export function resetMockStore(): void {
  groups.clear();
  expenses.clear();
}
