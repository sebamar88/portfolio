import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Runtime key for the database (see application/ports/tokens.ts for why a Symbol).
export const DATABASE = Symbol('DATABASE');

// Global so feature modules can inject DATABASE without importing this module each time.
// There is no ConfigModule yet: it arrives with the deploy slice, so we read the env directly.
@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: (): NodePgDatabase => {
        const url = process.env.DATABASE_URL;
        // Fail at startup with a clear message, not on the first request with a cryptic one.
        if (!url) throw new Error('DATABASE_URL is not set (copy the example env file and load it)');
        return drizzle(new Pool({ connectionString: url }));
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE) private readonly db: NodePgDatabase) {}

  // Closes the pool when the app stops, so the process can exit and connections are released.
  async onApplicationShutdown(): Promise<void> {
    await (this.db as NodePgDatabase & { $client: Pool }).$client.end();
  }
}
