// Takes the Expense entity, not a loose object: only valid expenses (shares add up to the total)
// can reach this function, which is what keeps the group's balances adding up to zero.
import type { Expense } from '../expenses/expense';

/** Net balance per member, in cents: positive = is owed money, negative = owes money. */
export type Balances = Record<string, number>;

/**
 * Each member's balance is what they paid minus their share of what was consumed.
 * Money only moves between members, so the balances of a group always add up to zero.
 */
export function computeBalances(expenses: Expense[]): Balances {
  const balances: Balances = {};
  const add = (memberId: string, amount: number) => {
    balances[memberId] = (balances[memberId] ?? 0) + amount;
  };

  for (const expense of expenses) {
    add(expense.payerId, expense.total); // paid for everyone: the group owes it to them
    for (const share of expense.shares) {
      add(share.memberId, -share.amount); // consumed their share: they owe it
    }
  }
  return balances;
}
