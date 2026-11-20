import { describe, expect, it } from 'vitest';
import { InvalidBalancesError } from './invalid-balances.error';
import { settleDebts } from './settle-debts';

describe('settleDebts', () => {
  it('settles a group with the fewest obvious transfers', () => {
    // Ana is owed $30; Bruno owes $10, Carla owes $20. Everyone pays Ana directly: 2 transfers.
    expect(settleDebts({ ana: 3000, bruno: -1000, carla: -2000 })).toEqual([
      { from: 'carla', to: 'ana', amount: 2000 },
      { from: 'bruno', to: 'ana', amount: 1000 },
    ]);
  });

  it('refuses balances that do not add up to zero instead of inventing transfers', () => {
    // A non-zero sum means money was created or lost earlier: a bug to surface, not to settle.
    expect(() => settleDebts({ ana: 3000, bruno: -1000 })).toThrow(InvalidBalancesError);
  });

  it('returns no transfers when everyone is already settled', () => {
    expect(settleDebts({ ana: 0, bruno: 0 })).toEqual([]);
  });
});
