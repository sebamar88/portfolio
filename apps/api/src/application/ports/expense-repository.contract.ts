import { beforeEach, describe, expect, it } from 'vitest';
import { Expense } from '../../domain/expenses/expense';
import { Group } from '../../domain/groups/group';
import type { ExpenseRepository } from './expense-repository';
import type { GroupRepository } from './group-repository';

export interface ExpenseRepositories {
  groups: GroupRepository;
  expenses: ExpenseRepository;
}

const at = (iso: string) => new Date(iso);

function anExpense(overrides: Partial<Parameters<typeof Expense.create>[0]> = {}): Expense {
  return Expense.create({
    id: 'e1',
    groupId: 'g1',
    description: 'Dinner',
    paidAt: '2026-05-21',
    createdAt: at('2026-05-21T12:00:00.000Z'),
    payerId: 'ana',
    total: 1001,
    shares: [
      { memberId: 'bruno', amount: 500 },
      { memberId: 'ana', amount: 501 },
    ],
    ...overrides,
  });
}

/**
 * Contract tests every ExpenseRepository adapter must pass (in-memory and Postgres run the same
 * ones). The factory also returns a GroupRepository because Postgres expenses reference groups.
 */
export function expenseRepositoryContract(adapterName: string, make: () => ExpenseRepositories | Promise<ExpenseRepositories>) {
  describe(`ExpenseRepository contract (${adapterName})`, () => {
    let groups: GroupRepository;
    let expenses: ExpenseRepository;

    // Several groups so tests can prove expenses never leak between groups.
    beforeEach(async () => {
      ({ groups, expenses } = await make());
      await groups.save(Group.create({ id: 'g1', name: 'Trip' }));
      await groups.save(Group.create({ id: 'g2', name: 'Home' }));
    });

    const ids = (items: Expense[]) => items.map((e) => e.id);

    it('returns nothing for a group without expenses', async () => {
      expect(await expenses.findAllByGroup('g1')).toEqual([]);
      expect(await expenses.listPage('g1', { limit: 10 })).toEqual({ items: [], next: null });
    });

    it('stores every field, keeping the order of the shares', async () => {
      await expenses.save(anExpense());

      const [found] = await expenses.findAllByGroup('g1');
      expect(found).toMatchObject({
        id: 'e1',
        groupId: 'g1',
        description: 'Dinner',
        paidAt: '2026-05-21',
        payerId: 'ana',
        total: 1001,
        shares: [
          { memberId: 'bruno', amount: 500 },
          { memberId: 'ana', amount: 501 },
        ],
      });
      expect(found.createdAt).toEqual(at('2026-05-21T12:00:00.000Z'));
    });

    it('stamps createdAt when the expense has none', async () => {
      await expenses.save(anExpense({ createdAt: undefined }));
      expect((await expenses.findAllByGroup('g1'))[0].createdAt).toBeInstanceOf(Date);
    });

    it('keeps expenses of different groups apart', async () => {
      await expenses.save(anExpense({ id: 'a', groupId: 'g1' }));
      await expenses.save(anExpense({ id: 'b', groupId: 'g2' }));

      expect(ids(await expenses.findAllByGroup('g1'))).toEqual(['a']);
      expect(ids((await expenses.listPage('g2', { limit: 10 })).items)).toEqual(['b']);
    });

    it('orders newest first: paidAt, then createdAt, then id (all descending)', async () => {
      await expenses.save(anExpense({ id: 'old', paidAt: '2026-05-01' }));
      await expenses.save(anExpense({ id: 'new-early', paidAt: '2026-05-10', createdAt: at('2026-05-10T08:00:00.000Z') }));
      await expenses.save(anExpense({ id: 'new-late', paidAt: '2026-05-10', createdAt: at('2026-05-10T09:00:00.000Z') }));
      await expenses.save(anExpense({ id: 'tie-a', paidAt: '2026-05-05', createdAt: at('2026-05-05T08:00:00.000Z') }));
      await expenses.save(anExpense({ id: 'tie-b', paidAt: '2026-05-05', createdAt: at('2026-05-05T08:00:00.000Z') }));

      const { items } = await expenses.listPage('g1', { limit: 10 });
      expect(ids(items)).toEqual(['new-late', 'new-early', 'tie-b', 'tie-a', 'old']);
    });

    it('pages through everything exactly once, with no gaps or repeats', async () => {
      // Same paidAt and createdAt on purpose: only the id tie-breaker separates these rows.
      for (const id of ['a', 'b', 'c', 'd', 'e']) {
        await expenses.save(anExpense({ id, paidAt: '2026-05-10', createdAt: at('2026-05-10T08:00:00.000Z') }));
      }

      const seen: string[] = [];
      let after;
      for (let pages = 0; pages < 10; pages++) {
        const page = await expenses.listPage('g1', { limit: 2, after });
        seen.push(...ids(page.items));
        if (!page.next) break;
        after = page.next;
      }
      expect(seen).toEqual(['e', 'd', 'c', 'b', 'a']);
    });

    it('has no next cursor when the last page is exactly full', async () => {
      await expenses.save(anExpense({ id: 'a' }));
      await expenses.save(anExpense({ id: 'b' }));

      const page = await expenses.listPage('g1', { limit: 2 });
      expect(ids(page.items)).toEqual(['b', 'a']);
      expect(page.next).toBeNull();
    });

    it('hands back a cursor that points at the last returned item', async () => {
      await expenses.save(anExpense({ id: 'a' }));
      await expenses.save(anExpense({ id: 'b' }));

      const page = await expenses.listPage('g1', { limit: 1 });
      expect(page.next).toEqual({ paidAt: '2026-05-21', createdAt: at('2026-05-21T12:00:00.000Z'), id: 'b' });
    });

    it('updates an expense saved twice instead of duplicating it', async () => {
      await expenses.save(anExpense());
      await expenses.save(anExpense({ description: 'Lunch', total: 200, shares: [{ memberId: 'ana', amount: 200 }] }));

      const all = await expenses.findAllByGroup('g1');
      expect(all).toHaveLength(1);
      expect(all[0].description).toBe('Lunch');
      expect(all[0].shares).toEqual([{ memberId: 'ana', amount: 200 }]);
    });
  });
}
