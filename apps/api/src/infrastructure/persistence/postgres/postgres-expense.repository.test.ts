import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { eq, sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { expenseRepositoryContract } from '../../../application/ports/expense-repository.contract';
import { PostgresExpenseRepository } from './postgres-expense.repository';
import { PostgresGroupRepository } from './postgres-group.repository';
import { expenseShares, expenses, groups } from './schema';

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: NodePgDatabase;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17-alpine').start();
  pool = new Pool({ connectionString: container.getConnectionUri() });
  db = drizzle(pool);
  await migrate(db, { migrationsFolder: './drizzle' });
}, 60_000);

afterAll(async () => {
  await pool?.end();
  await container?.stop();
});

expenseRepositoryContract('postgres', async () => {
  // CASCADE also empties expenses and expense_shares.
  await db.execute(sql`TRUNCATE groups CASCADE`);
  return { groups: new PostgresGroupRepository(db), expenses: new PostgresExpenseRepository(db) };
});

describe('Postgres expense constraints', () => {
  const expense = { id: 'e1', groupId: 'g', description: 'Dinner', total: 100, payerId: 'ana', paidAt: '2026-05-21' };

  it('rejects an expense for a group that does not exist', async () => {
    await db.execute(sql`TRUNCATE groups CASCADE`);
    await expect(db.insert(expenses).values(expense)).rejects.toThrow();
  });

  it('deletes expenses and their shares when the group is deleted', async () => {
    await db.execute(sql`TRUNCATE groups CASCADE`);
    await db.insert(groups).values({ id: 'g', name: 'Trip' });
    await db.insert(expenses).values(expense);
    await db.insert(expenseShares).values({ expenseId: 'e1', memberId: 'ana', amount: 100, position: 0 });

    await db.delete(groups).where(eq(groups.id, 'g'));

    expect(await db.select().from(expenses)).toEqual([]);
    expect(await db.select().from(expenseShares)).toEqual([]);
  });
});
