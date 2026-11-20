/** The requested group does not exist. Application-level: the domain never looks groups up. */
export class GroupNotFoundError extends Error {
  override readonly name = 'GroupNotFoundError';

  constructor(readonly groupId: string) {
    super(`Group "${groupId}" was not found`);
  }
}
