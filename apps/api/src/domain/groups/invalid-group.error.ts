/** A group that breaks a business rule (e.g. an empty name or a duplicated member). */
export class InvalidGroupError extends Error {
  override readonly name = 'InvalidGroupError';
}
