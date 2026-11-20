// Pure money rules, hand-copied from apps/api (this package must not import the API's code).
// The contract tests compare the mock against the API's behavior, which keeps the copies honest.
import type { components } from '../schema';

type Share = components['schemas']['ShareResponse'];
type Transfer = components['schemas']['TransferResponse'];

/** A rule the API enforces with a 400; handlers turn it into the same error body. */
export class RuleError extends Error {}

const AMOUNT = /^(\d+)(?:\.(\d{1,2}))?$/;

/** "12.50" → 1250, reading the text so no float rounding can lose a cent. */
export function parseAmount(text: unknown): number {
  const match = typeof text === 'string' ? AMOUNT.exec(text) : null;
  if (!match) throw new RuleError('amount must be a non-negative decimal with at most 2 decimals, e.g. "12.50"');
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  if (!Number.isSafeInteger(cents)) throw new RuleError('amount is too large');
  return cents;
}

/** Equal split; the remainder cents go to the first members, one each. */
export function splitEqually(total: number, memberIds: string[]): Share[] {
  if (memberIds.length === 0) throw new RuleError('An expense must be split between at least one member');
  const duplicated = memberIds.find((id, index) => memberIds.indexOf(id) !== index);
  if (duplicated !== undefined) throw new RuleError(`Member "${duplicated}" appears more than once`);
  const base = Math.floor(total / memberIds.length);
  const remainder = total % memberIds.length;
  return memberIds.map((memberId, index) => ({ memberId, amount: index < remainder ? base + 1 : base }));
}

export function validateDescription(text: string): string {
  const description = text.trim();
  if (description.length === 0 || description.length > 120) {
    throw new RuleError('An expense description must have 1 to 120 characters');
  }
  return description;
}

export function validatePaidAt(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  const real = /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  if (!real) throw new RuleError(`paidAt must be a real date as YYYY-MM-DD, got "${value}"`);
  return value;
}

export function computeBalances(expenses: { payerId: string; amount: number; shares: Share[] }[]): Record<string, number> {
  const balances: Record<string, number> = {};
  const add = (memberId: string, amount: number) => void (balances[memberId] = (balances[memberId] ?? 0) + amount);
  for (const expense of expenses) {
    add(expense.payerId, expense.amount);
    for (const share of expense.shares) add(share.memberId, -share.amount);
  }
  return balances;
}

/** Greedy settlement: the biggest debtor pays the biggest creditor, ties broken by id. */
export function settleDebts(balances: Record<string, number>): Transfer[] {
  const byAmountThenId = (a: { id: string; amount: number }, b: { id: string; amount: number }) =>
    b.amount - a.amount || a.id.localeCompare(b.id);
  const debtors = Object.entries(balances).filter(([, v]) => v < 0).map(([id, v]) => ({ id, amount: -v }));
  const creditors = Object.entries(balances).filter(([, v]) => v > 0).map(([id, v]) => ({ id, amount: v }));
  const transfers: Transfer[] = [];
  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort(byAmountThenId);
    creditors.sort(byAmountThenId);
    const [debtor, creditor] = [debtors[0], creditors[0]];
    const amount = Math.min(debtor.amount, creditor.amount);
    transfers.push({ from: debtor.id, to: creditor.id, amount });
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) debtors.shift();
    if (creditor.amount === 0) creditors.shift();
  }
  return transfers;
}

interface Cursor {
  paidAt: string;
  createdAt: string;
  id: string;
}

// Same opaque format as the API (base64url JSON), so a cursor from either works with the other.
export function encodeCursor(cursor: Cursor): string {
  const bytes = new TextEncoder().encode(JSON.stringify({ p: cursor.paidAt, c: cursor.createdAt, i: cursor.id }));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function decodeCursor(text: string): Cursor {
  const invalid = () => new RuleError('cursor is not valid');
  let payload: unknown;
  try {
    const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
    payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0))));
  } catch {
    throw invalid();
  }
  if (typeof payload !== 'object' || payload === null) throw invalid();
  const { p, c, i } = payload as Record<string, unknown>;
  if (typeof p !== 'string' || typeof c !== 'string' || typeof i !== 'string' || Number.isNaN(Date.parse(c))) throw invalid();
  return { paidAt: p, createdAt: c, id: i };
}

/** Negative when `a` comes first in the newest-first order: paidAt, createdAt, id, all descending. */
export function newestFirst(a: Cursor, b: Cursor): number {
  if (a.paidAt !== b.paidAt) return a.paidAt < b.paidAt ? 1 : -1;
  const [ta, tb] = [Date.parse(a.createdAt), Date.parse(b.createdAt)];
  if (ta !== tb) return ta < tb ? 1 : -1;
  if (a.id !== b.id) return a.id < b.id ? 1 : -1;
  return 0;
}
