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

describe('OpenAPI document (e2e)', () => {
  it('serves the spec with one operationId per endpoint', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json');
    expect(res.status).toBe(200);
    const operationIds = Object.values<Record<string, { operationId?: string }>>(res.body.paths).flatMap(
      (methods) => Object.values(methods).map((operation) => operation.operationId),
    );
    expect(operationIds).toEqual(expect.arrayContaining(['createGroup', 'getGroup', 'addMember']));
  });
});
