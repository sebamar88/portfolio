import { Inject, Injectable } from '@nestjs/common';
import type { Expense } from '../../domain/expenses/expense';
import { GroupNotFoundError } from '../errors/group-not-found.error';
import { InvalidPaginationError } from '../errors/invalid-pagination.error';
import type { ExpenseCursor, ExpenseRepository } from '../ports/expense-repository';
import type { GroupRepository } from '../ports/group-repository';
import { EXPENSE_REPOSITORY, GROUP_REPOSITORY } from '../ports/tokens';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface ExpensePageResult {
  items: Expense[];
  nextCursor: string | null;
}

@Injectable()
export class ListExpenses {
  constructor(
    @Inject(GROUP_REPOSITORY) private readonly groups: GroupRepository,
    @Inject(EXPENSE_REPOSITORY) private readonly expenses: ExpenseRepository,
  ) {}

  async execute(input: { groupId: string; limit?: number; cursor?: string }): Promise<ExpensePageResult> {
    const limit = input.limit ?? DEFAULT_LIMIT;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new InvalidPaginationError(`limit must be a whole number from 1 to ${MAX_LIMIT}`);
    }
    const after = input.cursor === undefined ? undefined : decodeCursor(input.cursor);

    if (!(await this.groups.findById(input.groupId))) throw new GroupNotFoundError(input.groupId);

    const page = await this.expenses.listPage(input.groupId, { limit, after });
    return { items: page.items, nextCursor: page.next ? encodeCursor(page.next) : null };
  }
}

// The cursor is base64url JSON so clients treat it as opaque and we can change its contents later.
function encodeCursor(cursor: ExpenseCursor): string {
  const payload = { p: cursor.paidAt, c: cursor.createdAt.toISOString(), i: cursor.id };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeCursor(text: string): ExpenseCursor {
  const invalid = () => new InvalidPaginationError('cursor is not valid');
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(text, 'base64url').toString('utf8'));
  } catch {
    throw invalid();
  }
  if (typeof payload !== 'object' || payload === null) throw invalid();
  const { p, c, i } = payload as Record<string, unknown>;
  if (typeof p !== 'string' || typeof c !== 'string' || typeof i !== 'string') throw invalid();
  const createdAt = new Date(c);
  if (Number.isNaN(createdAt.getTime())) throw invalid();
  return { paidAt: p, createdAt, id: i };
}
