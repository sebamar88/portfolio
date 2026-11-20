import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { GroupRepository } from '../../../application/ports/group-repository';
import { Group } from '../../../domain/groups/group';
import { DATABASE } from '../../database/database.module';
import { groupMembers, groups } from './schema';

@Injectable()
export class PostgresGroupRepository implements GroupRepository {
  constructor(@Inject(DATABASE) private readonly db: NodePgDatabase) {}

  async save(group: Group): Promise<void> {
    // One transaction: if any step fails, everything is rolled back, so a group is never
    // left half-saved (new name but old members, or no members at all).
    await this.db.transaction(async (tx) => {
      await tx
        .insert(groups)
        .values({ id: group.id, name: group.name })
        .onConflictDoUpdate({ target: groups.id, set: { name: group.name } });

      // Simplest way to sync the members: drop the old rows and write the current list again.
      await tx.delete(groupMembers).where(eq(groupMembers.groupId, group.id));
      if (group.memberIds.length > 0) {
        await tx.insert(groupMembers).values(
          // The index becomes `position`, which keeps the order members were added in.
          group.memberIds.map((memberId, position) => ({ groupId: group.id, memberId, position })),
        );
      }
    });
  }

  async findById(id: string): Promise<Group | null> {
    // Two small queries instead of a left join: a join repeats the group name on every member
    // row and needs special handling for a group with no members. This reads straight through.
    const [row] = await this.db.select().from(groups).where(eq(groups.id, id));
    if (!row) return null;

    const members = await this.db
      .select({ memberId: groupMembers.memberId })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, id))
      .orderBy(asc(groupMembers.position));

    return Group.restore({ id: row.id, name: row.name, memberIds: members.map((m) => m.memberId) });
  }
}
