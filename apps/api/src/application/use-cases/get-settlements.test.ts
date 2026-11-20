import { beforeEach, describe, expect, it } from 'vitest';
import { Group } from '../../domain/groups/group';
import { InMemoryExpenseRepository } from '../../infrastructure/persistence/in-memory-expense.repository';
import { InMemoryGroupRepository } from '../../infrastructure/persistence/in-memory-group.repository';
import { GroupNotFoundError } from '../errors/group-not-found.error';
import { AddExpense } from './add-expense';
import { GetSettlements } from './get-settlements';

describe('GetSettlements', () => {
  let addExpense: AddExpense;
  let getSettlements: GetSettlements;

  beforeEach(async () => {
    const groups = new InMemoryGroupRepository();
    const expenses = new InMemoryExpenseRepository();
    const group = Group.create({ id: 'g1', name: 'Trip' });
    for (const id of ['ana', 'bruno', 'carla']) group.addMember(id);
    await groups.save(group);
    let n = 0;
    addExpense = new AddExpense(groups, expenses, { next: () => `e${++n}` }, { now: () => new Date() });
    getSettlements = new GetSettlements(groups, expenses);
  });

  it('has no transfers when nobody owes anything', async () => {
    expect(await getSettlements.execute({ groupId: 'g1' })).toEqual([]);
  });

  it('turns the balances into transfers that settle the group', async () => {
    await addExpense.execute({ groupId: 'g1', description: 'Dinner', amount: 3000, payerId: 'ana', paidAt: '2026-05-20' });

    expect(await getSettlements.execute({ groupId: 'g1' })).toEqual([
      { from: 'bruno', to: 'ana', amount: 1000 },
      { from: 'carla', to: 'ana', amount: 1000 },
    ]);
  });

  it('fails with GroupNotFoundError for an unknown group', async () => {
    await expect(getSettlements.execute({ groupId: 'nope' })).rejects.toThrow(GroupNotFoundError);
  });
});
