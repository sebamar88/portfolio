import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ExpenseCursor, ExpensePage, ExpenseRepository } from '../../../application/ports/expense-repository';
import { Expense } from '../../../domain/expenses/expense';
import { DATABASE } from '../../database/database.module';
import { expenseShares, expenses } from './schema';

type ExpenseRow = typeof expenses.$inferSelect;

@Injectable()
export class PostgresExpenseRepository implements ExpenseRepository {
  constructor(@Inject(DATABASE) private readonly db: NodePgDatabase) {}

  async save(expense: Expense): Promise<void> {
    // One transaction so an expense never exists without all of its shares.
    await this.db.transaction(async (tx) => {
      const values = {
        groupId: expense.groupId,
        description: expense.description,
        total: expense.total,
        payerId: expense.payerId,
        paidAt: expense.paidAt,
        // Undefined lets the column default (now()) stamp it.
        createdAt: expense.createdAt,
      };
      await tx
        .insert(expenses)
        .values({ id: expense.id, ...values })
        .onConflictDoUpdate({ target: expenses.id, set: values });

      await tx.delete(expenseShares).where(eq(expenseShares.expenseId, expense.id));
      await tx.insert(expenseShares).values(
        expense.shares.map((share, position) => ({ expenseId: expense.id, memberId: share.memberId, amount: share.amount, position })),
      );
    });
  }

  async findAllByGroup(groupId: string): Promise<Expense[]> {
    const rows = await this.db.select().from(expenses).where(eq(expenses.groupId, groupId)).orderBy(...NEWEST_FIRST);
    return this.hydrate(rows);
  }

  async listPage(groupId: string, options: { limit: number; after?: ExpenseCursor }): Promise<ExpensePage> {
    const { after } = options;
    // Keyset pagination: "rows strictly after the cursor" instead of OFFSET, so inserts between
    // requests can't shift pages. Spelled out as OR/AND because the three keys sort descending.
    const afterCursor = after
      ? or(
          sql`${expenses.paidAt} < ${after.paidAt}`,
          and(eq(expenses.paidAt, after.paidAt), sql`${expenses.createdAt} < ${after.createdAt}`),
          and(eq(expenses.paidAt, after.paidAt), eq(expenses.createdAt, after.createdAt), sql`${expenses.id} < ${after.id}`),
        )
      : undefined;

    const rows = await this.db
      .select()
      .from(expenses)
      .where(and(eq(expenses.groupId, groupId), afterCursor))
      .orderBy(...NEWEST_FIRST)
      // One extra row tells us whether another page exists.
      .limit(options.limit + 1);

    const items = await this.hydrate(rows.slice(0, options.limit));
    const last = items.at(-1);
    const next = rows.length > options.limit && last ? { paidAt: last.paidAt, createdAt: last.createdAt!, id: last.id } : null;
    return { items, next };
  }

  // Loads all shares of the given expenses in one query instead of one per expense.
  private async hydrate(rows: ExpenseRow[]): Promise<Expense[]> {
    if (rows.length === 0) return [];
    const shareRows = await this.db
      .select()
      .from(expenseShares)
      .where(inArray(expenseShares.expenseId, rows.map((r) => r.id)))
      .orderBy(asc(expenseShares.position));

    return rows.map((row) =>
      Expense.create({
        id: row.id,
        groupId: row.groupId,
        description: row.description,
        paidAt: row.paidAt,
        createdAt: row.createdAt,
        payerId: row.payerId,
        total: row.total,
        shares: shareRows.filter((s) => s.expenseId === row.id).map((s) => ({ memberId: s.memberId, amount: s.amount })),
      }),
    );
  }
}

const NEWEST_FIRST = [desc(expenses.paidAt), desc(expenses.createdAt), desc(expenses.id)] as const;
