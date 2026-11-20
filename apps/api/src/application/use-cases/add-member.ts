import { Inject, Injectable } from '@nestjs/common';
import type { Group } from '../../domain/groups/group';
import { GroupNotFoundError } from '../errors/group-not-found.error';
import type { GroupRepository } from '../ports/group-repository';
import { GROUP_REPOSITORY } from '../ports/tokens';

// Trade-off: @Injectable/@Inject are the only Nest imports in use cases. They are plain
// decorators, so tests still build the class with `new` and no Nest.
@Injectable()
export class AddMember {
  constructor(@Inject(GROUP_REPOSITORY) private readonly groups: GroupRepository) {}

  async execute(input: { groupId: string; memberId: string }): Promise<Group> {
    const group = await this.groups.findById(input.groupId);
    if (!group) throw new GroupNotFoundError(input.groupId);
    // The domain checks the rules (e.g. no duplicates); nothing is saved if it throws.
    group.addMember(input.memberId);
    await this.groups.save(group);
    return group;
  }
}
