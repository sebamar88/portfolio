import type { Group } from '../../domain/groups/group';

/**
 * Port: what the application needs to store groups, not how. It lives here, next to the use
 * cases that need it; infrastructure (memory, Postgres) implements it. Dependencies point inward.
 */
export interface GroupRepository {
  save(group: Group): Promise<void>;
  findById(id: string): Promise<Group | null>;
}
