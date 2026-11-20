import { Controller, Get, Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS } from '../../application/ports/tokens';

@Controller('health')
export class HealthController {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  // Always 200 while the process is up: with Redis down the service is degraded (jobs wait,
  // sockets still accept clients) rather than dead, so it should not be restarted for it.
  @Get()
  async check() {
    const redis = await this.pingRedis();
    return { status: redis === 'up' ? 'ok' : 'degraded', redis };
  }

  private async pingRedis(): Promise<'up' | 'down'> {
    let timer: NodeJS.Timeout | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), 1000);
      });
      await Promise.race([this.redis.ping(), timeout]);
      return 'up';
    } catch {
      return 'down';
    } finally {
      clearTimeout(timer);
    }
  }
}
