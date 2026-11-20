import type { Redis } from 'ioredis';
import type { PushTokenStore } from '../../application/ports/push';

export class RedisPushTokenStore implements PushTokenStore {
  constructor(private readonly redis: Redis) {}

  private setName(groupId: string) {
    return `realtime:push-tokens:${groupId}`;
  }

  async add(groupId: string, token: string): Promise<void> {
    await this.redis.sadd(this.setName(groupId), token); // a set: registering twice is harmless
  }

  list(groupId: string): Promise<string[]> {
    return this.redis.smembers(this.setName(groupId));
  }
}
