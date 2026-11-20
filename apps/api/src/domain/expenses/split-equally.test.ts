import { describe, expect, it } from 'vitest';
import { InvalidSplitError } from './invalid-split.error';
import { splitEqually } from './split-equally';

describe('splitEqually', () => {
  it('splits an amount that divides exactly', () => {
    // $9.00 between 3 people: 300 cents each.
    expect(splitEqually(900, ['ana', 'bruno', 'carla'])).toEqual([
      { memberId: 'ana', amount: 300 },
      { memberId: 'bruno', amount: 300 },
      { memberId: 'carla', amount: 300 },
    ]);
  });

  it('gives the leftover cents to the first members, one each', () => {
    // $10.00 between 3: 1000 / 3 = 333.33... A third of a cent doesn't exist, and 333 each loses a
    // cent (999). So the first member pays the remaining cent: 334 + 333 + 333 = 1000.
    expect(splitEqually(1000, ['ana', 'bruno', 'carla'])).toEqual([
      { memberId: 'ana', amount: 334 },
      { memberId: 'bruno', amount: 333 },
      { memberId: 'carla', amount: 333 },
    ]);
  });

  it('rejects an expense with no members instead of losing the money', () => {
    // Without this guard it returned [] silently: 1000 cents spent, 0 cents assigned.
    expect(() => splitEqually(1000, [])).toThrow(InvalidSplitError);
    expect(() => splitEqually(1000, [])).toThrow('at least one member');
  });

  it('rejects duplicated members instead of silently charging someone twice', () => {
    // Probably a bug upstream (e.g. a double click). Weighted splits get their own explicit
    // function later (splitByShares), so intent is never hidden in a repeated id.
    expect(() => splitEqually(1000, ['ana', 'ana', 'bruno'])).toThrow(InvalidSplitError);
    expect(() => splitEqually(1000, ['ana', 'ana', 'bruno'])).toThrow('ana');
  });

  it.each([
    [10.5, 'a whole number of cents'],
    [Number.NaN, 'a whole number of cents'],
    [-500, 'zero or more'],
  ])('rejects an invalid total (%s)', (total, message) => {
    expect(() => splitEqually(total, ['ana', 'bruno'])).toThrow(message);
  });
});
