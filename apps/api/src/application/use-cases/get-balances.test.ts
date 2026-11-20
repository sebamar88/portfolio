import { beforeEach, describe, expect, it } from 'vitest';
import { Group } from '../../domain/groups/group';
import { InMemoryExpenseRepository } from '../../infrastructure/persistence/in-memory-expense.repository';
import { InMemoryGroupRepository } from '../../infrastructure/persistence/in-memory-group.repository';
import { GroupNotFoundError } from '../errors/group-not-found.error';
import { AddExpense } from './add-expense';
import { GetBalances } from './get-balances';

describe('GetBalances', () => {
  let addExpense: AddExpense;
  let getBalances: GetBalances;

  beforeEach(async () => {
    const groups = new InMemoryGroupRepository();
    const expenses = new InMemoryExpenseRepository();
    // Member order is deliberately not alphabetical: the result must follow it.
    const group = Group.create({ id: 'g1', name: 'Trip' });
    for (const id of ['carla', 'ana', 'bruno']) group.addMember(id);
    await groups.save(group);
    let n = 0;
    addExpense = new AddExpense(groups, expenses, { next: () => `e${++n}` }, { now: () => new Date() });
    getBalances = new GetBalances(groups, expenses);
  });

  it('lists every member with 0 when there are no expenses', async () => {
    expect(await getBalances.execute({ groupId: 'g1' })).toEqual([
      { memberId: 'carla', amount: 0 },
      { memberId: 'ana', amount: 0 },
      { memberId: 'bruno', amount: 0 },
    ]);
  });

  it('adds up what each member paid minus their share, in member order', async () => {
    await addExpense.execute({ groupId: 'g1', description: 'Dinner', amount: 3000, payerId: 'ana', paidAt: '2026-05-20' });

    expect(await getBalances.execute({ groupId: 'g1' })).toEqual([
      { memberId: 'carla', amount: -1000 },
      { memberId: 'ana', amount: 2000 },
      { memberId: 'bruno', amount: -1000 },
    ]);
  });

  it('fails with GroupNotFoundError for an unknown group', async () => {
    await expect(getBalances.execute({ groupId: 'nope' })).rejects.toThrow(GroupNotFoundError);
  });
});
