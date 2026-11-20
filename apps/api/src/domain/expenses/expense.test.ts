import { describe, expect, it } from 'vitest';
import { Expense } from './expense';
import { InvalidExpenseError } from './invalid-expense.error';

// Identity and metadata every expense needs; the tests below only vary what they are about.
const base = { id: 'e1', groupId: 'g1', description: 'Dinner', paidAt: '2026-05-21' };

describe('Expense.create', () => {
  it('rejects shares that do not add up to the total', () => {
    // $30.00 dinner, but only $20.00 is assigned: the other $10.00 would appear out of nowhere.
    expect(() =>
      Expense.create({
        ...base,
        payerId: 'ana',
        total: 3000,
        shares: [
          { memberId: 'ana', amount: 1000 },
          { memberId: 'bruno', amount: 1000 },
        ],
      }),
    ).toThrow(InvalidExpenseError);
  });

  it('accepts unequal shares as long as they add up to the total', () => {
    const expense = Expense.create({
      ...base,
      payerId: 'ana',
      total: 3000,
      shares: [
        { memberId: 'ana', amount: 2000 },
        { memberId: 'bruno', amount: 1000 },
      ],
    });
    expect(expense.total).toBe(3000);
    expect(expense.shares).toHaveLength(2);
  });
});

describe('Expense.create metadata', () => {
  const valid = { ...base, payerId: 'ana', total: 1000, shares: [{ memberId: 'ana', amount: 1000 }] };

  it('trims the description and keeps identity fields', () => {
    const expense = Expense.create({ ...valid, description: '  Dinner  ' });
    expect(expense).toMatchObject({ id: 'e1', groupId: 'g1', description: 'Dinner', paidAt: '2026-05-21' });
    expect(expense.createdAt).toBeUndefined();
  });

  it('keeps createdAt when given', () => {
    const createdAt = new Date('2026-05-21T10:00:00.000Z');
    expect(Expense.create({ ...valid, createdAt }).createdAt).toEqual(createdAt);
  });

  it.each(['', '   ', 'x'.repeat(121)])('rejects the description %j', (description) => {
    expect(() => Expense.create({ ...valid, description })).toThrow(InvalidExpenseError);
  });

  it('accepts a description of exactly 120 characters', () => {
    expect(Expense.create({ ...valid, description: 'x'.repeat(120) }).description).toHaveLength(120);
  });

  it.each(['2026-02-30', '2026-13-01', '2026-00-10', '26-01-01', '2026-1-1', '', '2026-05-21T10:00:00Z', 'yesterday'])(
    'rejects the paidAt %j (not a real YYYY-MM-DD date)',
    (paidAt) => {
      expect(() => Expense.create({ ...valid, paidAt })).toThrow(InvalidExpenseError);
    },
  );

  it('accepts a leap day', () => {
    expect(Expense.create({ ...valid, paidAt: '2024-02-29' }).paidAt).toBe('2024-02-29');
  });
});
