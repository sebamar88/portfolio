import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatAmount, InvalidAmountError, parseAmount } from './money';

describe('parseAmount', () => {
  it.each([
    ['12.50', 1250],
    ['12.5', 1250],
    ['12', 1200],
    ['0.05', 5],
    ['0.00', 0],
    ['0.1', 10],
    // Classic float traps: 19.99 * 100 = 1998.9999999999998 and 1.15 * 100 = 114.99999999999999.
    ['19.99', 1999],
    ['1.15', 115],
    ['1234567.89', 123456789],
  ])('parses %j as %i cents', (text, cents) => {
    expect(parseAmount(text)).toBe(cents);
  });

  it.each(['-1', '-0.50', '', ' ', 'abc', '1.234', '1.', '.5', '1e3', '+5', '1,50', '12.50 ', '1 2', '9'.repeat(20)])(
    'rejects %j',
    (text) => {
      expect(() => parseAmount(text)).toThrow(InvalidAmountError);
    },
  );

  it('rejects a non-string at runtime', () => {
    expect(() => parseAmount(12.5 as unknown as string)).toThrow(InvalidAmountError);
  });
});

describe('formatAmount', () => {
  it.each([
    [1250, '12.50'],
    [5, '0.05'],
    [0, '0.00'],
    [100, '1.00'],
  ])('formats %i cents as %j', (cents, text) => {
    expect(formatAmount(cents)).toBe(text);
  });
});

describe('money properties', () => {
  it('format(parse(x)) gives x back for every canonical amount', () => {
    const canonical = fc
      .tuple(fc.bigInt({ min: 0n, max: 90_000_000_000_000n }), fc.integer({ min: 0, max: 99 }))
      .map(([whole, cents]) => `${whole}.${String(cents).padStart(2, '0')}`);
    fc.assert(fc.property(canonical, (text) => formatAmount(parseAmount(text)) === text));
  });

  it('parse(format(n)) gives n back for every whole number of cents', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), (n) => parseAmount(formatAmount(n)) === n));
  });
});
