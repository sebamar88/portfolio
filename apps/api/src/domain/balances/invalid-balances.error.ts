/** Balances that can't come from a real group (e.g. they don't add up to zero). */
export class InvalidBalancesError extends Error {
  override readonly name = 'InvalidBalancesError';
}
