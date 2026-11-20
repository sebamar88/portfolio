import { describe, expect, it } from 'vitest';
import { Expense } from '../expenses/expense';
import { splitEqually } from '../expenses/split-equally';
import { computeBalances } from './compute-balances';

describe('computeBalances', () => {
  it('balance = what you paid - your share of what was consumed', () => {
    const members = ['ana', 'bruno', 'carla'];
    const expenses = [
      // Ana pays a $30.00 dinner split between the three.
      Expense.create({ payerId: 'ana', total: 3000, shares: splitEqually(3000, members) }),
      // Bruno pays a $15.00 taxi split between the three.
      Expense.create({ payerId: 'bruno', total: 1500, shares: splitEqually(1500, members) }),
    ];

    expect(computeBalances(expenses)).toEqual({ ana: 1500, bruno: 0, carla: -1500 });
  });
});
