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

  /** A frozen copy: callers can read the members but never change them behind addMember's back. */
  get memberIds(): readonly string[] {
    return Object.freeze([...this.#memberIds]);
  }

  addMember(memberId: string): void {
    if (this.#memberIds.includes(memberId)) {
      throw new InvalidGroupError(`"${memberId}" is already a member of this group`);
    }
    this.#memberIds.push(memberId);
  }
}
