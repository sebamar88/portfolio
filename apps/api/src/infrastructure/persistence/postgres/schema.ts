import { bigint, date, index, integer, pgTable, primaryKey, text, timestamp, unique } from 'drizzle-orm/pg-core';

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

export const expenses = pgTable(
  'expenses',
  {
    id: text('id').primaryKey(),
    // Deleting a group deletes its expenses (and, through them, their shares).
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    // Integer cents. bigint (read back as number) so a large amount can't overflow a 32-bit column.
    total: bigint('total', { mode: 'number' }).notNull(),
    payerId: text('payer_id').notNull(),
    // A calendar day with no time zone, read back as the 'YYYY-MM-DD' string the domain uses.
    paidAt: date('paid_at', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    // Matches the list order, so "newest expenses of a group" reads the index instead of sorting.
    index('expenses_group_order_idx').on(table.groupId, table.paidAt.desc(), table.createdAt.desc(), table.id.desc()),
  ],
);

export const expenseShares = pgTable(
  'expense_shares',
  {
    expenseId: text('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    memberId: text('member_id').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    // Shares keep the order the split produced them in (the extra cents go to the first ones).
    position: integer('position').notNull(),
  },
  (table) => [primaryKey({ columns: [table.expenseId, table.memberId] })],
);
