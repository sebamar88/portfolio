/** A group that breaks a business rule (e.g. an empty name or a duplicated member). */
export class InvalidGroupError extends Error {
  // Typed as string (not the literal) so subclasses like DuplicateMemberError can set their own name.
  override readonly name: string = 'InvalidGroupError';
}
