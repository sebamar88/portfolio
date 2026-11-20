import { Inject, Injectable } from '@nestjs/common';
import { Group } from '../../domain/groups/group';
import type { GroupRepository } from '../ports/group-repository';
import type { IdGenerator } from '../ports/id-generator';
import { GROUP_REPOSITORY, ID_GENERATOR } from '../ports/tokens';

/**
 * Use case: orchestrates, holds no business rules. Group.create validates; the repository stores.
 * It only knows the ports, so the same code runs with memory in tests and Postgres in production.
 *
 * @Injectable/@Inject are the only Nest imports here (a small trade-off); tests still use `new`.
 */
@Injectable()
export class CreateGroup {
  constructor(
    @Inject(GROUP_REPOSITORY) private readonly groups: GroupRepository,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
  ) {}

  async execute(input: { name: string }): Promise<Group> {
    const group = Group.create({ id: this.ids.next(), name: input.name });
    await this.groups.save(group);
    return group;
  }
}
