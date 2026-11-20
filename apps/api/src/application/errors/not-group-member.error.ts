/** A payer or participant who does not belong to the group. Application-level: it needs the group. */
export class NotGroupMemberError extends Error {
  override readonly name = 'NotGroupMemberError';

  constructor(readonly memberId: string) {
    super(`"${memberId}" is not a member of this group`);
  }
}
