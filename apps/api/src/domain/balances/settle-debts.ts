import type { Balances } from './compute-balances';
import { InvalidBalancesError } from './invalid-balances.error';

export interface Transfer {
  from: string;
  to: string;
  /** Integer minor units (cents), always > 0. */
  amount: number;
}

interface Position {
  memberId: string;
  amount: number; // what is still owed (debtors) or still due (creditors), always > 0
}

// Biggest amount first; ties broken by id so the same balances always give the same transfers.
const byAmountThenId = (a: Position, b: Position) => b.amount - a.amount || a.memberId.localeCompare(b.memberId);

/**
 * Turns balances into transfers that leave everyone at zero.
 *
 * Greedy: the biggest debtor pays the biggest creditor the smaller of the two amounts, which
 * settles at least one of them, then repeat. That needs at most n - 1 transfers for n members
 * with a non-zero balance. (The true minimum is NP-hard to find, so this bound is the practical
 * choice, the same one apps like Splitwise make.)
 */
export function settleDebts(balances: Balances): Transfer[] {
  // Precondition: a real group's balances add up to zero. Otherwise money was created or lost
  // upstream, and settling would hide that bug behind plausible-looking transfers.
  const sum = Object.values(balances).reduce((total, amount) => total + amount, 0);
  if (sum !== 0) {
    throw new InvalidBalancesError(`Balances must add up to zero, got ${sum}`);
  }

  const debtors: Position[] = [];
  const creditors: Position[] = [];
  for (const [memberId, amount] of Object.entries(balances)) {
    if (amount < 0) debtors.push({ memberId, amount: -amount });
    if (amount > 0) creditors.push({ memberId, amount });
  }

  const transfers: Transfer[] = [];
  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort(byAmountThenId);
    creditors.sort(byAmountThenId);
    const debtor = debtors[0];
    const creditor = creditors[0];

    const amount = Math.min(debtor.amount, creditor.amount);
    transfers.push({ from: debtor.memberId, to: creditor.memberId, amount });

    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) debtors.shift();
    if (creditor.amount === 0) creditors.shift();
  }
  return transfers;
}
