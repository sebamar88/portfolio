import { beforeEach, describe, expect, it } from 'vitest';
import { Expense } from '../../domain/expenses/expense';
import { Group } from '../../domain/groups/group';
import { InMemoryExpenseRepository } from '../../infrastructure/persistence/in-memory-expense.repository';
import { InMemoryGroupRepository } from '../../infrastructure/persistence/in-memory-group.repository';
import { GroupNotFoundError } from '../errors/group-not-found.error';
import { InvalidPaginationError } from '../errors/invalid-pagination.error';
import { ListExpenses } from './list-expenses';

describe('ListExpenses', () => {
  let expenses: InMemoryExpenseRepository;
  let listExpenses: ListExpenses;

  const seed = (id: string, paidAt: string, createdAt = '2026-05-21T10:00:00.000Z') =>
    expenses.save(
      Expense.create({
        id,
        groupId: 'g1',
        description: id,
        paidAt,
        createdAt: new Date(createdAt),
        payerId: 'ana',
        total: 100,
        shares: [{ memberId: 'ana', amount: 100 }],
      }),
    );

  beforeEach(async () => {
    const groups = new InMemoryGroupRepository();
    expenses = new InMemoryExpenseRepository();
    await groups.save(Group.create({ id: 'g1', name: 'Trip' }));
    listExpenses = new ListExpenses(groups, expenses);
  });

  it('lists newest first', async () => {
    await seed('old', '2026-05-01');
    await seed('new', '2026-05-09');
    await seed('mid', '2026-05-05');

    const page = await listExpenses.execute({ groupId: 'g1' });
    expect(page.items.map((e) => e.id)).toEqual(['new', 'mid', 'old']);
    expect(page.nextCursor).toBeNull();
  });

  it('follows an opaque cursor through every page once', async () => {
    for (const [i, id] of ['a', 'b', 'c', 'd', 'e'].entries()) await seed(id, `2026-05-0${i + 1}`);

    const first = await listExpenses.execute({ groupId: 'g1', limit: 2 });
    expect(first.items.map((e) => e.id)).toEqual(['e', 'd']);
    // Opaque: clients must not depend on what is inside, only on it being base64 text.
    expect(first.nextCursor).toMatch(/^[A-Za-z0-9_-]+$/);

    const second = await listExpenses.execute({ groupId: 'g1', limit: 2, cursor: first.nextCursor! });
    expect(second.items.map((e) => e.id)).toEqual(['c', 'b']);

    const third = await listExpenses.execute({ groupId: 'g1', limit: 2, cursor: second.nextCursor! });
    expect(third.items.map((e) => e.id)).toEqual(['a']);
    expect(third.nextCursor).toBeNull();
  });

  it('defaults to 20 items per page', async () => {
    for (let i = 0; i < 21; i++) await seed(`e${String(i).padStart(2, '0')}`, '2026-05-01');
    const page = await listExpenses.execute({ groupId: 'g1' });
    expect(page.items).toHaveLength(20);
    expect(page.nextCursor).not.toBeNull();
  });

  it.each([1, 100])('accepts the limit %i', async (limit) => {
    await expect(listExpenses.execute({ groupId: 'g1', limit })).resolves.toBeDefined();
  });

  it.each([0, -1, 101, 1.5, Number.NaN])('rejects the limit %s', async (limit) => {
    await expect(listExpenses.execute({ groupId: 'g1', limit })).rejects.toThrow(InvalidPaginationError);
  });

  it.each(['not-base64-json', Buffer.from('{"p":1}').toString('base64url'), Buffer.from('[]').toString('base64url'), ''])(
    'rejects the malformed cursor %j',
    async (cursor) => {
      await expect(listExpenses.execute({ groupId: 'g1', cursor })).rejects.toThrow(InvalidPaginationError);
    },
  );

  it('fails with GroupNotFoundError for an unknown group', async () => {
    await expect(listExpenses.execute({ groupId: 'nope' })).rejects.toThrow(GroupNotFoundError);
  });
});
