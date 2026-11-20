# @portfolio/contracts

The contract between the Core API and everything that talks to it. Other modules depend on this
package, never on API internals, so each one can run against the mock before the API is deployed.

## The flow

```text
1. API code (DTOs + @Api* decorators)   apps/api
2. openapi.json                         generated from the running code
3. src/schema.ts, client, mock          types generated; client and mock typed against them
```

```sh
pnpm contract:generate   # from the repo root: runs step 1 → 2 → 3 in order
```

`openapi.json` and `src/schema.ts` are generated and committed: never edit them by hand.

## Using it

```ts
import { createApiClient } from '@portfolio/contracts';

const api = createApiClient('http://localhost:3000');
const { data, error } = await api.POST('/groups', { body: { name: 'Trip' } });
```

Mock (MSW), for tests or for running a frontend without the API:

```ts
import { server } from '@portfolio/contracts/mock/node'; // Node; in a browser use `setupWorker(...handlers)`
import { handlers, resetMockStore } from '@portfolio/contracts/mock';
```

The handlers are written by hand but typed with the generated schema, so a contract change
breaks them at compile time (`pnpm --filter @portfolio/contracts build`). Call `resetMockStore()`
between tests.

## CI rule

The API workflow regenerates the contract and fails if `git diff` is not empty. If it fails, run
`pnpm contract:generate` and commit the result.
