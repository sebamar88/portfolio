import { DuplicateMemberError } from './duplicate-member.error';
import { InvalidGroupError } from './invalid-group.error';

const MAX_NAME_LENGTH = 60;

/**
 * A group of people sharing expenses. Like Expense, the constructor is private: `Group.create`
 * validates the name, and `addMember` is the only way to change the members, so the rules can't
 * be skipped.
 */
export class Group {
  readonly #memberIds: string[];

  private constructor(
    readonly id: string,
    readonly name: string,
    memberIds: string[],
  ) {
    this.#memberIds = memberIds;
  }

  static create(props: { id: string; name: string }): Group {
    const name = props.name.trim();
    if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
      throw new InvalidGroupError(`A group name must have 1 to ${MAX_NAME_LENGTH} characters`);
    }
    return new Group(props.id, name, []);
  }

  /**
   * Rebuilds a group that was already stored (used by repositories). It goes through the same
   * rules as creating one, so corrupted stored data fails loudly instead of entering the domain.
   */
  static restore(props: { id: string; name: string; memberIds: readonly string[] }): Group {
    const group = Group.create({ id: props.id, name: props.name });
    for (const memberId of props.memberIds) group.addMember(memberId);
    return group;
  }

  /** A frozen copy: callers can read the members but never change them behind addMember's back. */
  get memberIds(): readonly string[] {
    return Object.freeze([...this.#memberIds]);
  }

  addMember(memberId: string): void {
    if (this.#memberIds.includes(memberId)) {
      throw new DuplicateMemberError(`"${memberId}" is already a member of this group`);
    }
    this.#memberIds.push(memberId);
  }
}
