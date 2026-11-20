import { Global, Inject, Injectable, Logger, Module } from '@nestjs/common';
import type { DynamicModule, OnApplicationShutdown } from '@nestjs/common';
import { Redis } from 'ioredis';
import type { ConnectionOptions } from 'bullmq';
import { APP_CONFIG, REDIS } from '../../application/ports/tokens';
import type { AppConfig } from '../../config';

/** BullMQ wants connection options (it opens and closes its own connections), not a URL. */
export function bullConnectionFromUrl(redisUrl: string): ConnectionOptions {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: url.pathname.length > 1 ? Number(url.pathname.slice(1)) : undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
  };
}

@Injectable()
class RedisShutdown implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async onApplicationShutdown() {
    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }
}

// Shared client for idempotency entries, push tokens and the health probe.
@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => {
        const logger = new Logger('Redis');
        // Commands fail after 3 reconnect attempts instead of hanging forever while Redis is
        // down; BullMQ then retries the job. ioredis keeps reconnecting in the background.
        const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 3 });
        // Without a listener an 'error' event would crash the process.
        redis.on('error', (error) => logger.warn(`Redis error: ${error.message}`));
        return redis;
      },
    },
    RedisShutdown,
  ],
  exports: [REDIS],
})
export class RedisModule {
  static forConfig(config: AppConfig): DynamicModule {
    return { module: RedisModule, providers: [{ provide: APP_CONFIG, useValue: config }] };
  }
}
