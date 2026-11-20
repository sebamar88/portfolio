import { describe, expect, it } from 'vitest';
import { Expense } from './expense';
import { InvalidExpenseError } from './invalid-expense.error';

describe('Expense.create', () => {
  it('rejects shares that do not add up to the total', () => {
    // $30.00 dinner, but only $20.00 is assigned: the other $10.00 would appear out of nowhere.
    expect(() =>
      Expense.create({
        payerId: 'ana',
        total: 3000,
        shares: [
          { memberId: 'ana', amount: 1000 },
          { memberId: 'bruno', amount: 1000 },
        ],
      }),
    ).toThrow(InvalidExpenseError);
  });

  it('accepts unequal shares as long as they add up to the total', () => {
    const expense = Expense.create({
      payerId: 'ana',
      total: 3000,
      shares: [
        { memberId: 'ana', amount: 2000 },
        { memberId: 'bruno', amount: 1000 },
      ],
    });
    expect(expense.total).toBe(3000);
    expect(expense.shares).toHaveLength(2);
  });
});
