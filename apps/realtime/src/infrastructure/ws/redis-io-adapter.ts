import { Logger } from '@nestjs/common';
import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { ServerOptions } from 'socket.io';

/**
 * Socket.IO rooms live in the memory of one process. Without this adapter a notification emitted
 * by the instance whose worker handled the job would only reach clients connected to THAT
 * instance. The adapter relays every emit through Redis Pub/Sub, so each instance also delivers
 * it to its own clients in the room, whichever instance they connected to.
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly log = new Logger(RedisIoAdapter.name);
  private readonly pub: Redis;
  private readonly sub: Redis;

  constructor(app: INestApplicationContext, redisUrl: string) {
    super(app);
    // Pub/Sub needs a dedicated connection: a subscribed client can't run other commands.
    this.pub = new Redis(redisUrl);
    this.sub = this.pub.duplicate();
    for (const client of [this.pub, this.sub]) {
      client.on('error', (error) => this.log.warn(`Redis error: ${error.message}`));
    }
  }

  override createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    server.adapter(createAdapter(this.pub, this.sub));
    return server;
  }

  override async dispose() {
    await super.dispose();
    await Promise.all(
      [this.pub, this.sub].map((client) => client.quit().catch(() => client.disconnect())),
    );
  }
}
