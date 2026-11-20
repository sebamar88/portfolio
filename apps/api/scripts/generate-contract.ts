// Writes the OpenAPI document of the running code to packages/contracts/openapi.json.
// Run through `pnpm contract:generate` (see package.json): it compiles this file with SWC first,
// because Nest's DI needs decorator metadata and Node's built-in TypeScript support can't emit it.
import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { GROUP_REPOSITORY } from '../src/application/ports/tokens';
import { DATABASE } from '../src/infrastructure/database/database.module';
import { InMemoryGroupRepository } from '../src/infrastructure/persistence/in-memory-group.repository';
import { buildOpenApiDocument } from '../src/openapi';
import { fakeDatabase } from '../test/support/fake-database';

// Sorted keys: the same code must always produce the same bytes, or regenerating
// would show noise in git diffs. Array order is meaningful, so arrays keep theirs.
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, sortKeys(child)]),
    );
  }
  return value;
}

async function main() {
  // Same swap as the in-memory e2e test: no Postgres is needed just to describe the API.
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(GROUP_REPOSITORY)
    .useValue(new InMemoryGroupRepository())
    .overrideProvider(DATABASE)
    .useValue(fakeDatabase)
    .compile();
  const app = moduleRef.createNestApplication();
  const document = buildOpenApiDocument(app);
  await app.close();

  const target = resolve(__dirname, '../../../../packages/contracts/openapi.json');
  writeFileSync(target, `${JSON.stringify(sortKeys(document), null, 2)}\n`);
}

main();
