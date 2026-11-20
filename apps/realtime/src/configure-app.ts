import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import type { AppConfig } from './config';
import { RedisIoAdapter } from './infrastructure/ws/redis-io-adapter';

// Shared by main.ts and the tests, so tests run the exact same pipeline as production.
export function configureApp(app: INestApplication, config: AppConfig): void {
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  // Socket.IO over Redis Pub/Sub, so notifications reach clients on every instance.
  app.useWebSocketAdapter(new RedisIoAdapter(app, config.redisUrl));
}
