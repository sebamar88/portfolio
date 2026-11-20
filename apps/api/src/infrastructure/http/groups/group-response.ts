import { ApiProperty } from '@nestjs/swagger';
import type { Group } from '../../../domain/groups/group';

// Explicit @ApiProperty instead of the Nest CLI plugin: the plugin is a build step that
// Vitest (Oxc) would not run, so tests and the generated contract could disagree.
export class GroupResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: [String] })
  memberIds!: string[];
}

// The API shape is explicit and separate from the entity, so renaming a domain field
// can't silently change what clients receive.
export function toGroupResponse(group: Group): GroupResponse {
  return { id: group.id, name: group.name, memberIds: [...group.memberIds] };
}
