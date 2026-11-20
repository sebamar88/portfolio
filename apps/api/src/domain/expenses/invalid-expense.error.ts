/** An expense that breaks a business rule (e.g. its shares don't add up to its total). */
export class InvalidExpenseError extends Error {
  override readonly name = 'InvalidExpenseError';
}
