import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Nest's dependency injection reads decorator metadata (constructor parameter types) at runtime.
  // Vite 8 compiles TypeScript with Oxc, which can emit that metadata; we turn it on explicitly
  // (the same setup the NestJS repo uses) instead of relying on it finding tsconfig.json.
  oxc: {
    decorator: { legacy: true, emitDecoratorMetadata: true },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // Integration tests start a Redis container and several Nest apps.
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
