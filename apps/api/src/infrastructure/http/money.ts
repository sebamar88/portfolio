/** The amount text is not a valid non-negative money value. */
export class InvalidAmountError extends Error {
  override readonly name = 'InvalidAmountError';
}

// Digits, optionally a dot with 1 or 2 decimals. No sign, no exponent, no spaces.
const AMOUNT = /^(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Turns "12.50" into 1250 cents by reading the text, never by float * 100
 * (19.99 * 100 is 1998.9999999999998, which would silently lose a cent).
 * Only 2 decimals for now: USD is the only currency; others may need other exponents later.
 */
export function parseAmount(text: string): number {
  const match = typeof text === 'string' ? AMOUNT.exec(text) : null;
  if (!match) throw new InvalidAmountError('amount must be a non-negative decimal with at most 2 decimals, e.g. "12.50"');
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  // Past 2^53 integers stop being exact, so a huge amount would be stored as a different number.
  if (!Number.isSafeInteger(cents)) throw new InvalidAmountError('amount is too large');
  return cents;
}

/** The inverse of parseAmount: 1250 → "12.50". */
export function formatAmount(cents: number): string {
  const whole = Math.floor(cents / 100);
  return `${whole}.${String(cents % 100).padStart(2, '0')}`;
}
