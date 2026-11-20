import type { ExpenseCursor, ExpensePage, ExpenseRepository } from '../../application/ports/expense-repository';
import { Expense } from '../../domain/expenses/expense';

// Positive when `a` comes later in the newest-first order: paidAt, createdAt, id, all descending.
function compareNewestFirst(a: ExpenseCursor, b: ExpenseCursor): number {
  if (a.paidAt !== b.paidAt) return a.paidAt < b.paidAt ? 1 : -1;
  if (a.createdAt.getTime() !== b.createdAt.getTime()) return a.createdAt.getTime() < b.createdAt.getTime() ? 1 : -1;
  if (a.id !== b.id) return a.id < b.id ? 1 : -1;
  return 0;
}

const keyOf = (e: Expense): ExpenseCursor => ({ paidAt: e.paidAt, createdAt: e.createdAt!, id: e.id });

/**
 * Fake adapter for tests. Like the group one it keeps copies, and it follows the same
 * ordering and createdAt rules as Postgres, so the contract tests hold both to one behavior.
 */
export class InMemoryExpenseRepository implements ExpenseRepository {
  readonly #rows = new Map<string, Expense>();

  async save(expense: Expense): Promise<void> {
    // Postgres stamps created_at when the caller gives none; do the same here.
    const createdAt = expense.createdAt ?? new Date();
    this.#rows.set(expense.id, Expense.create({ ...expense, shares: [...expense.shares], createdAt }));
  }

  async findAllByGroup(groupId: string): Promise<Expense[]> {
    return [...this.#rows.values()]
      .filter((e) => e.groupId === groupId)
      .sort((a, b) => compareNewestFirst(keyOf(a), keyOf(b)));
  }

  async listPage(groupId: string, options: { limit: number; after?: ExpenseCursor }): Promise<ExpensePage> {
    const { after } = options;
    const candidates = (await this.findAllByGroup(groupId)).filter((e) => !after || compareNewestFirst(keyOf(e), after) > 0);
    // One past the limit tells us whether another page exists without a separate count.
    const items = candidates.slice(0, options.limit);
    const last = items.at(-1);
    return { items, next: candidates.length > options.limit && last ? keyOf(last) : null };
  }
}
