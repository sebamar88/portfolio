import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// For Node consumers (tests, SSR): `server.listen()` before, `server.close()` after.
export const server = setupServer(...handlers);
