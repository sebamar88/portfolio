import { index, integer, pgTable, primaryKey, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const groups = pgTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const groupMembers = pgTable(
  'group_members',
  {
    // Deleting a group deletes its members too, so no orphan rows are left behind.
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull(),
    // Members keep the order they were added in; the domain exposes them as an ordered list.
    position: integer('position').notNull(),
  },
  (table) => [
    // The database itself refuses the same member twice in a group, even if the code has a bug.
    primaryKey({ columns: [table.groupId, table.memberId] }),
    unique().on(table.groupId, table.position),
    // "Which groups is X in?" must not scan the whole table.
    index('group_members_member_id_idx').on(table.memberId),
  ],
);
