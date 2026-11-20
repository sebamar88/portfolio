import { InvalidGroupError } from './invalid-group.error';

/** The member is already in the group. Its own type so callers can tell it apart from other rule breaks. */
export class DuplicateMemberError extends InvalidGroupError {
  override readonly name = 'DuplicateMemberError';
}
