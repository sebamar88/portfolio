import type { GroupRepository } from '../../application/ports/group-repository';
import { Group } from '../../domain/groups/group';

interface StoredGroup {
  id: string;
  name: string;
  memberIds: string[];
}

/**
 * Fake adapter for tests. It stores plain copies, never the Group object itself, so it behaves
 * like a real database: changing a group after save() does nothing until save() is called again.
 */
export class InMemoryGroupRepository implements GroupRepository {
  readonly #rows = new Map<string, StoredGroup>();

  async save(group: Group): Promise<void> {
    this.#rows.set(group.id, { id: group.id, name: group.name, memberIds: [...group.memberIds] });
  }

  async findById(id: string): Promise<Group | null> {
    const row = this.#rows.get(id);
    return row ? Group.restore(row) : null;
  }
}
