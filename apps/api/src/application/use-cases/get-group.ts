import { Inject, Injectable } from '@nestjs/common';
import type { Group } from '../../domain/groups/group';
import { GroupNotFoundError } from '../errors/group-not-found.error';
import type { GroupRepository } from '../ports/group-repository';
import { GROUP_REPOSITORY } from '../ports/tokens';

@Injectable()
export class GetGroup {
  constructor(@Inject(GROUP_REPOSITORY) private readonly groups: GroupRepository) {}

  async execute(input: { groupId: string }): Promise<Group> {
    const group = await this.groups.findById(input.groupId);
    if (!group) throw new GroupNotFoundError(input.groupId);
    return group;
  }
}
