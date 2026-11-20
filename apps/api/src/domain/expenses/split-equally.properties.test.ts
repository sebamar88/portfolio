import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { splitEqually } from './split-equally';

// Property-based tests: instead of hand-picked examples, fast-check generates hundreds of random
// valid inputs and checks that the rules hold for all of them. On failure it shrinks the input to
// the smallest case that still breaks the rule.

const total = fc.integer({ min: 0, max: 10_000_000 }); // up to $100,000.00
const members = fc.uniqueArray(fc.string({ minLength: 1, maxLength: 8 }), { minLength: 1, maxLength: 50 });

describe('splitEqually properties', () => {
  it('never creates or loses a cent: shares add up to the total', () => {
    fc.assert(
      fc.property(total, members, (amount, ids) => {
        const sum = splitEqually(amount, ids).reduce((acc, share) => acc + share.amount, 0);
        expect(sum).toBe(amount);
      }),
    );
  });

  it('is fair: shares differ by at most one cent', () => {
    fc.assert(
      fc.property(total, members, (amount, ids) => {
        const amounts = splitEqually(amount, ids).map((share) => share.amount);
        expect(Math.max(...amounts) - Math.min(...amounts)).toBeLessThanOrEqual(1);
      }),
    );
  });

  it('gives every member exactly one share, in order', () => {
    fc.assert(
      fc.property(total, members, (amount, ids) => {
        expect(splitEqually(amount, ids).map((share) => share.memberId)).toEqual(ids);
      }),
    );
  });
});
