import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { splitEqually } from '../expenses/split-equally';
import { Expense } from '../expenses/expense';
import { computeBalances } from './compute-balances';

// Random groups with random expenses, each split equally between a random subset of members.
const groupWithExpenses = fc
  .uniqueArray(fc.string({ minLength: 1, maxLength: 6 }), { minLength: 1, maxLength: 10 })
  .chain((members) =>
    fc.tuple(
      fc.constant(members),
      fc.array(
        fc.record({
          payerId: fc.constantFrom(...members),
          total: fc.integer({ min: 0, max: 1_000_000 }),
          participants: fc.subarray(members, { minLength: 1 }),
        }),
        { maxLength: 30 },
      ),
    ),
  )
  .map(([, rawExpenses]): Expense[] =>
    rawExpenses.map(({ payerId, total, participants }) =>
      Expense.create({ id: 'e', groupId: 'g', description: 'Shared', paidAt: '2026-05-21', payerId, total, shares: splitEqually(total, participants) }),
    ),
  );

describe('computeBalances properties', () => {
  it('conserves money: the balances of a group always add up to zero', () => {
    fc.assert(
      fc.property(groupWithExpenses, (expenses) => {
        const sum = Object.values(computeBalances(expenses)).reduce((acc, value) => acc + value, 0);
        expect(sum).toBe(0);
      }),
    );
  });
});
