import { beforeEach, describe, expect, it } from 'vitest';
import { InvalidExpenseError } from '../../domain/expenses/invalid-expense.error';
import { Group } from '../../domain/groups/group';
import { InMemoryExpenseRepository } from '../../infrastructure/persistence/in-memory-expense.repository';
import { InMemoryGroupRepository } from '../../infrastructure/persistence/in-memory-group.repository';
import { GroupNotFoundError } from '../errors/group-not-found.error';
import { NotGroupMemberError } from '../errors/not-group-member.error';
import { AddExpense } from './add-expense';

const NOW = new Date('2026-05-21T12:00:00.000Z');

describe('AddExpense', () => {
  let groups: InMemoryGroupRepository;
  let expenses: InMemoryExpenseRepository;
  let addExpense: AddExpense;

  beforeEach(async () => {
    groups = new InMemoryGroupRepository();
    expenses = new InMemoryExpenseRepository();
    const group = Group.create({ id: 'g1', name: 'Trip' });
    for (const id of ['ana', 'bruno', 'carla']) group.addMember(id);
    await groups.save(group);
    addExpense = new AddExpense(groups, expenses, { next: () => 'e1' }, { now: () => NOW });
  });

  const input = { groupId: 'g1', description: 'Dinner', amount: 1000, payerId: 'ana', paidAt: '2026-05-20' };

  it('splits equally between all members by default, handing the extra cent to the first', async () => {
    const expense = await addExpense.execute(input);

    expect(expense).toMatchObject({ id: 'e1', groupId: 'g1', total: 1000, payerId: 'ana', paidAt: '2026-05-20', createdAt: NOW });
    expect(expense.shares).toEqual([
      { memberId: 'ana', amount: 334 },
      { memberId: 'bruno', amount: 333 },
      { memberId: 'carla', amount: 333 },
    ]);
    expect(await expenses.findAllByGroup('g1')).toHaveLength(1);
  });

  it('splits only between the given participants', async () => {
    const expense = await addExpense.execute({ ...input, participantIds: ['bruno', 'carla'] });
    expect(expense.shares).toEqual([
      { memberId: 'bruno', amount: 500 },
      { memberId: 'carla', amount: 500 },
    ]);
  });

  it('lets the payer pay for others without taking part in the split', async () => {
    const expense = await addExpense.execute({ ...input, participantIds: ['bruno'] });
    expect(expense.payerId).toBe('ana');
    expect(expense.shares).toEqual([{ memberId: 'bruno', amount: 1000 }]);
  });

  it('fails with GroupNotFoundError for an unknown group and stores nothing', async () => {
    await expect(addExpense.execute({ ...input, groupId: 'nope' })).rejects.toThrow(GroupNotFoundError);
    expect(await expenses.findAllByGroup('nope')).toEqual([]);
  });

  it('rejects a payer who is not a member and stores nothing', async () => {
    await expect(addExpense.execute({ ...input, payerId: 'zed' })).rejects.toThrow(NotGroupMemberError);
    expect(await expenses.findAllByGroup('g1')).toEqual([]);
  });

  it('rejects a participant who is not a member and stores nothing', async () => {
    await expect(addExpense.execute({ ...input, participantIds: ['bruno', 'zed'] })).rejects.toThrow('"zed" is not a member');
    expect(await expenses.findAllByGroup('g1')).toEqual([]);
  });

  it('rejects an invalid description through the domain and stores nothing', async () => {
    await expect(addExpense.execute({ ...input, description: '   ' })).rejects.toThrow(InvalidExpenseError);
    expect(await expenses.findAllByGroup('g1')).toEqual([]);
  });

  it('rejects an invalid paidAt through the domain', async () => {
    await expect(addExpense.execute({ ...input, paidAt: '2026-02-30' })).rejects.toThrow(InvalidExpenseError);
  });
});
