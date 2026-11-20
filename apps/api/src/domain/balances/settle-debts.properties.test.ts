import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Balances } from './compute-balances';
import { settleDebts } from './settle-debts';

// Random balances that add up to zero: every member except the last gets a random amount and the
// last one takes the opposite of the sum, like a real group (money only moves between members).
const zeroSumBalances = fc
  .uniqueArray(fc.string({ minLength: 1, maxLength: 6 }), { minLength: 2, maxLength: 12 })
  .chain((ids) =>
    fc.array(fc.integer({ min: -100_000, max: 100_000 }), { minLength: ids.length - 1, maxLength: ids.length - 1 }).map(
      (amounts): Balances => {
        const last = -amounts.reduce((sum, amount) => sum + amount, 0);
        return Object.fromEntries(ids.map((id, index) => [id, index < amounts.length ? amounts[index] : last]));
      },
    ),
  );

const apply = (balances: Balances, transfers: ReturnType<typeof settleDebts>) => {
  const result = { ...balances };
  for (const { from, to, amount } of transfers) {
    result[from] += amount; // the debtor pays: owes less
    result[to] -= amount; // the creditor receives: is owed less
  }
  return result;
};

describe('settleDebts properties', () => {
  it('leaves every member at exactly zero', () => {
    fc.assert(
      fc.property(zeroSumBalances, (balances) => {
        const after = apply(balances, settleDebts(balances));
        expect(Object.values(after).every((amount) => amount === 0)).toBe(true);
      }),
    );
  });

  it('needs at most n - 1 transfers for n members with a non-zero balance', () => {
    fc.assert(
      fc.property(zeroSumBalances, (balances) => {
        const unsettled = Object.values(balances).filter((amount) => amount !== 0).length;
        expect(settleDebts(balances).length).toBeLessThanOrEqual(Math.max(unsettled - 1, 0));
      }),
    );
  });

  it('only moves positive whole cents between different members', () => {
    fc.assert(
      fc.property(zeroSumBalances, (balances) => {
        for (const transfer of settleDebts(balances)) {
          expect(Number.isInteger(transfer.amount) && transfer.amount > 0).toBe(true);
          expect(transfer.from).not.toBe(transfer.to);
        }
      }),
    );
  });
});
