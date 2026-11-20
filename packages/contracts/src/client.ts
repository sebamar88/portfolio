import createClient from 'openapi-fetch';
import type { paths } from './schema';

// `paths` comes from the generated schema, so every URL, body and response is checked
// against the real API contract at compile time.
export function createApiClient(baseUrl: string) {
  // openapi-fetch grabs `fetch` when the client is created. Looking it up on every call lets
  // MSW (which replaces globalThis.fetch when its server starts) intercept even clients created earlier.
  return createClient<paths>({ baseUrl, fetch: (request) => globalThis.fetch(request) });
}
