import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { DATABASE } from '../src/infrastructure/database/database.module';
import { fakeDatabase } from './support/fake-database';

describe('health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Boot the real AppModule, like production, but without opening a network port.
    // AppModule now includes the groups feature, which needs a database. Health must not, so we
    // swap DATABASE for a fake: the probe stays testable without Postgres or DATABASE_URL.
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE)
      .useValue(fakeDatabase)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 and { status: "ok" }', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns 404 for an unknown route', async () => {
    await request(app.getHttpServer()).get('/nope').expect(404);
  });
});
