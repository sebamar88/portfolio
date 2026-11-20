import type { Expense } from '../../domain/expenses/expense';

/** Position of an expense in the newest-first order; the next page starts right after it. */
export interface ExpenseCursor {
  paidAt: string;
  createdAt: Date;
  id: string;
}

export interface ExpensePage {
  items: Expense[];
  /** Cursor of the last item when more exist, otherwise null. */
  next: ExpenseCursor | null;
}

/**
 * Port: storage for expenses. Order is always newest first: paidAt, then createdAt, then id,
 * all descending. Using id as the last key makes the order total, so pages never skip or repeat.
 */
export interface ExpenseRepository {
  /** Inserts or replaces the expense (and its shares). */
  save(expense: Expense): Promise<void>;
  /** Every expense of the group, newest first (balances need all of them). */
  findAllByGroup(groupId: string): Promise<Expense[]>;
  listPage(groupId: string, options: { limit: number; after?: ExpenseCursor }): Promise<ExpensePage>;
}
