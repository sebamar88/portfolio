import { InvalidExpenseError } from './invalid-expense.error';
import type { Share } from './split-equally';

const MAX_DESCRIPTION_LENGTH = 120;

export interface ExpenseProps {
  id: string;
  groupId: string;
  /** Trimmed; 1 to 120 characters. */
  description: string;
  /** The day it was paid, as a date-only `YYYY-MM-DD` string (no time zone to get wrong). */
  paidAt: string;
  /** Set when the expense is recorded; stored expenses always carry it. */
  createdAt?: Date;
  payerId: string;
  /** Integer minor units (cents). */
  total: number;
  shares: Share[];
}

/**
 * An expense whose shares always add up to its total.
 *
 * The constructor is private, so `Expense.create` is the only way to get one, and it refuses to
 * build an invalid expense. Any `Expense` in the codebase is therefore valid: code that receives
 * one (like computeBalances) never has to re-check it.
 */
export class Expense {
  // TypeScript compares types by shape, so without this a hand-written object literal with the same
  // public fields would also count as an Expense. A private field can only come from this class,
  // which makes only real instances (built and validated by create) acceptable.
  // oxlint-disable-next-line no-unused-private-class-members -- it is never read on purpose: it is a type brand
  readonly #validated = true;

  private constructor(
    readonly id: string,
    readonly groupId: string,
    readonly description: string,
    readonly paidAt: string,
    readonly createdAt: Date | undefined,
    readonly payerId: string,
    readonly total: number,
    readonly shares: readonly Share[],
  ) {}

  static create(props: ExpenseProps): Expense {
    const description = props.description.trim();
    if (description.length === 0 || description.length > MAX_DESCRIPTION_LENGTH) {
      throw new InvalidExpenseError(`An expense description must have 1 to ${MAX_DESCRIPTION_LENGTH} characters`);
    }
    if (!isRealDate(props.paidAt)) {
      throw new InvalidExpenseError(`paidAt must be a real date as YYYY-MM-DD, got "${props.paidAt}"`);
    }
    const assigned = props.shares.reduce((sum, share) => sum + share.amount, 0);
    if (assigned !== props.total) {
      throw new InvalidExpenseError(
        `Shares add up to ${assigned} but the expense total is ${props.total}`,
      );
    }
    // Copy and freeze: if the caller mutates its array later, this expense must not change.
    const shares = Object.freeze(props.shares.map((share) => Object.freeze({ ...share })));
    return new Expense(props.id, props.groupId, description, props.paidAt, props.createdAt, props.payerId, props.total, shares);
  }
}

/** Shape check plus a round trip through Date, which catches impossible days like 2026-02-30. */
function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}
