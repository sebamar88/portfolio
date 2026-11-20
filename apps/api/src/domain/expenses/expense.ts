import { InvalidExpenseError } from './invalid-expense.error';
import type { Share } from './split-equally';

export interface ExpenseProps {
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
  readonly #validated = true;

  private constructor(
    readonly payerId: string,
    readonly total: number,
    readonly shares: readonly Share[],
  ) {}

  static create(props: ExpenseProps): Expense {
    const assigned = props.shares.reduce((sum, share) => sum + share.amount, 0);
    if (assigned !== props.total) {
      throw new InvalidExpenseError(
        `Shares add up to ${assigned} but the expense total is ${props.total}`,
      );
    }
    // Copy and freeze: if the caller mutates its array later, this expense must not change.
    const shares = Object.freeze(props.shares.map((share) => Object.freeze({ ...share })));
    return new Expense(props.payerId, props.total, shares);
  }
}
