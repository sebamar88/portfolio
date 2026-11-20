import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { eq, sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { groupRepositoryContract } from '../../../application/ports/group-repository.contract';
import { PostgresGroupRepository } from './postgres-group.repository';
import { groupMembers, groups } from './schema';

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: NodePgDatabase;

// One real Postgres for the whole file: starting a container per test would be far too slow.
beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17-alpine').start();
  pool = new Pool({ connectionString: container.getConnectionUri() });
  db = drizzle(pool);
  // Run the committed migrations, so the tests check the real schema and not a copy of it.
  await migrate(db, { migrationsFolder: './drizzle' });
}, 60_000);

afterAll(async () => {
  await pool?.end();
  await container?.stop();
});

groupRepositoryContract('postgres', async () => {
  // Every contract test must start with an empty database; CASCADE also empties group_members.
  await db.execute(sql`TRUNCATE groups CASCADE`);
  return new PostgresGroupRepository(db);
});

describe('Postgres constraints', () => {
  it('rejects the same member twice in a group at the database level', async () => {
    await db.insert(groups).values({ id: 'dup', name: 'Trip' });
    await db.insert(groupMembers).values({ groupId: 'dup', memberId: 'ana', position: 0 });

    await expect(db.insert(groupMembers).values({ groupId: 'dup', memberId: 'ana', position: 1 })).rejects.toThrow();
  });

  it('deletes the members of a group when the group is deleted', async () => {
    await db.insert(groups).values({ id: 'gone', name: 'Trip' });
    await db.insert(groupMembers).values({ groupId: 'gone', memberId: 'ana', position: 0 });

    await db.delete(groups).where(eq(groups.id, 'gone'));

    expect(await db.select().from(groupMembers).where(eq(groupMembers.groupId, 'gone'))).toEqual([]);
  });
});
