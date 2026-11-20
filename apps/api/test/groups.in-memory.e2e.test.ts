import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { GROUP_REPOSITORY } from '../src/application/ports/tokens';
import { configureApp } from '../src/configure-app';
import { DATABASE } from '../src/infrastructure/database/database.module';
import { InMemoryGroupRepository } from '../src/infrastructure/persistence/in-memory-group.repository';
import { fakeDatabase } from './support/fake-database';

let app: INestApplication;

// The same HTTP flow as groups.e2e.test.ts, with no database: this is the one-line swap
// hexagonal architecture promised. Only the adapter changes; controller and use cases don't.
beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(GROUP_REPOSITORY)
    .useValue(new InMemoryGroupRepository())
    .overrideProvider(DATABASE)
    .useValue(fakeDatabase)
    .compile();
  app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
});

afterAll(async () => {
  await app.close();
});

describe('groups (e2e, in-memory repository)', () => {
  it('creates a group and reads it back', async () => {
    const created = await request(app.getHttpServer()).post('/groups').send({ name: 'Trip' }).expect(201);
    const res = await request(app.getHttpServer()).get(`/groups/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });

  it('answers 409 for a duplicate member', async () => {
    const { body } = await request(app.getHttpServer()).post('/groups').send({ name: 'Trip' });
    await request(app.getHttpServer()).post(`/groups/${body.id}/members`).send({ memberId: 'ana' }).expect(201);
    await request(app.getHttpServer()).post(`/groups/${body.id}/members`).send({ memberId: 'ana' }).expect(409);
  });

  it('answers 404 for an unknown group', async () => {
    await request(app.getHttpServer()).get('/groups/nope').expect(404);
  });
});
