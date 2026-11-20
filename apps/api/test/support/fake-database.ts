// Stands in for the real DATABASE in tests that never touch Postgres. It only has the
// `$client.end()` that DatabaseModule calls on shutdown, so nothing connects anywhere.
export const fakeDatabase = { $client: { end: async () => {} } };
