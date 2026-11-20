/**
 * A split that breaks a business rule. Domain errors know nothing about HTTP: the API layer
 * will translate them into a 400 response later.
 */
export class InvalidSplitError extends Error {
  override readonly name = 'InvalidSplitError';
}
