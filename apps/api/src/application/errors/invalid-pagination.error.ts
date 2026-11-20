/** The limit or cursor of a list request is not acceptable. */
export class InvalidPaginationError extends Error {
  override readonly name = 'InvalidPaginationError';
}
