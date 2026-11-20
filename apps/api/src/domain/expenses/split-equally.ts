import { InvalidSplitError } from './invalid-split.error';

export interface Share {
  memberId: string;
  /** Integer minor units (cents). */
  amount: number;
}

/**
 * Splits `total` (in cents) equally between `memberIds`.
 *
 * Cents can't be divided, so everyone pays the integer quotient and the remainder is handed out
 * one cent at a time to the first members. Shares differ by at most one cent and always add up
 * to exactly `total`: no cent is created or lost.
 */
export function splitEqually(total: number, memberIds: string[]): Share[] {
  // Guards first: each one blocks an input that would silently create, lose or misassign money.
  if (!Number.isInteger(total)) {
    throw new InvalidSplitError(`The total must be a whole number of cents, got ${total}`);
  }
  if (total < 0) {
    throw new InvalidSplitError(`The total must be zero or more, got ${total}`);
  }
  if (memberIds.length === 0) {
    throw new InvalidSplitError('An expense must be split between at least one member');
  }
  const duplicated = memberIds.find((id, index) => memberIds.indexOf(id) !== index);
  if (duplicated !== undefined) {
    throw new InvalidSplitError(`Member "${duplicated}" appears more than once`);
  }

  const base = Math.floor(total / memberIds.length);
  const remainder = total % memberIds.length;
  return memberIds.map((memberId, index) => ({
    memberId,
    amount: index < remainder ? base + 1 : base,
  }));
}
