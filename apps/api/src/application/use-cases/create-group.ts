import { Group } from '../../domain/groups/group';
import type { GroupRepository } from '../ports/group-repository';
import type { IdGenerator } from '../ports/id-generator';

/**
 * Use case: orchestrates, holds no business rules. Group.create validates; the repository stores.
 * It only knows the ports, so the same code runs with memory in tests and Postgres in production.
 */
export class CreateGroup {
  constructor(
    private readonly groups: GroupRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: { name: string }): Promise<Group> {
    const group = Group.create({ id: this.ids.next(), name: input.name });
    await this.groups.save(group);
    return group;
  }
}
