import type { Redis } from 'ioredis';
import type { ProcessedEvents } from '../../application/ports/processed-events';

const SEVEN_DAYS = 7 * 24 * 3600;

export class RedisProcessedEvents implements ProcessedEvents {
  constructor(
    private readonly redis: Redis,
    private readonly ttlSeconds = SEVEN_DAYS,
  ) {}

  private entry(eventId: string) {
    return `realtime:processed:${eventId}`;
  }

  async claim(eventId: string): Promise<boolean> {
    // SET NX is atomic: exactly one concurrent caller gets 'OK'. The TTL bounds memory use.
    return (await this.redis.set(this.entry(eventId), '1', 'EX', this.ttlSeconds, 'NX')) === 'OK';
  }

  async release(eventId: string): Promise<void> {
    await this.redis.del(this.entry(eventId));
  }
}
