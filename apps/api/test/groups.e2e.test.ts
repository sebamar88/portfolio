import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { expensesHttpSuite } from './support/expenses-http-suite';
import { groups } from '../src/infrastructure/persistence/postgres/schema';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: NodePgDatabase;
let app: INestApplication;

// One real Postgres for the whole file; the app talks to it exactly as in production.
beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17-alpine').start();
  pool = new Pool({ connectionString: container.getConnectionUri() });
  db = drizzle(pool);
  await migrate(db, { migrationsFolder: './drizzle' });

  // DatabaseModule reads this when the app is built.
  process.env.DATABASE_URL = container.getConnectionUri();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
}, 60_000);

afterAll(async () => {
  await app?.close();
  await pool?.end();
  await container?.stop();
});

beforeEach(async () => {
  await db.execute(sql`TRUNCATE groups CASCADE`);
});

const createGroup = (name = 'Trip') => request(app.getHttpServer()).post('/groups').send({ name });

describe('groups (e2e, real Postgres)', () => {
  it('POST /groups creates a group with a uuid id and a trimmed name', async () => {
    const res = await createGroup('  Trip  ');
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.stringMatching(UUID), name: 'Trip', memberIds: [] });
  });

  it.each(['', '   '])('POST /groups rejects an empty name (%j) with 400 and stores nothing', async (name) => {
    const res = await createGroup(name);
    expect(res.status).toBe(400);
    expect(res.body.statusCode).toBe(400);
    expect(await db.select().from(groups)).toEqual([]);
  });

  it('POST /groups rejects a missing name with 400', async () => {
    await request(app.getHttpServer()).post('/groups').send({}).expect(400);
  });

  it('POST /groups rejects an unknown field with 400', async () => {
    await request(app.getHttpServer()).post('/groups').send({ name: 'Trip', admin: true }).expect(400);
  });

  it('GET /groups/:id returns the group', async () => {
    const { body } = await createGroup();
    const res = await request(app.getHttpServer()).get(`/groups/${body.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(body);
  });

  it('GET /groups/:id returns 404 for an unknown group', async () => {
    const res = await request(app.getHttpServer()).get('/groups/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ statusCode: 404, error: 'Not Found', message: 'Group "nope" was not found' });
  });

  it('POST /groups/:id/members adds a member', async () => {
    const { body } = await createGroup();
    const res = await request(app.getHttpServer()).post(`/groups/${body.id}/members`).send({ memberId: 'ana' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ...body, memberIds: ['ana'] });
  });

  it('POST /groups/:id/members returns 409 for a duplicate member', async () => {
    const { body } = await createGroup();
    await request(app.getHttpServer()).post(`/groups/${body.id}/members`).send({ memberId: 'ana' }).expect(201);
    const res = await request(app.getHttpServer()).post(`/groups/${body.id}/members`).send({ memberId: 'ana' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Conflict');
  });

  it('POST /groups/:id/members returns 404 for an unknown group', async () => {
    await request(app.getHttpServer()).post('/groups/nope/members').send({ memberId: 'ana' }).expect(404);
  });

  it('POST /groups/:id/members returns 400 for an empty memberId', async () => {
    const { body } = await createGroup();
    await request(app.getHttpServer()).post(`/groups/${body.id}/members`).send({ memberId: '' }).expect(400);
  });

  it('keeps data in the real database', async () => {
    const { body } = await createGroup('Trip');
    await request(app.getHttpServer()).post(`/groups/${body.id}/members`).send({ memberId: 'ana' });
    // Read around the app, straight from Postgres, to prove it was really written.
    const rows = await db.execute(sql`SELECT g.name, m.member_id FROM groups g JOIN group_members m ON m.group_id = g.id`);
    expect(rows.rows).toEqual([{ name: 'Trip', member_id: 'ana' }]);
  });
});

expensesHttpSuite('real Postgres', () => app);
