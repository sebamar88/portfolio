import type { Group } from '../../../domain/groups/group';

// The API shape is explicit and separate from the entity, so renaming a domain field
// can't silently change what clients receive.
export function toGroupResponse(group: Group) {
  return { id: group.id, name: group.name, memberIds: [...group.memberIds] };
}
