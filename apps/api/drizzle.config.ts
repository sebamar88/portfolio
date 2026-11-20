import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/persistence/postgres/schema.ts',
  // Generated SQL is committed: it is the reviewable history of the database structure.
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? 'postgres://expenses:expenses@localhost:5432/expenses' },
});
