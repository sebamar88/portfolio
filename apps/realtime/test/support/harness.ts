import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { Queue } from 'bullmq';
import { EVENTS_QUEUE } from '@portfolio/events';
import { io } from 'socket.io-client';
import { AppModule } from '../../src/app.module';
import { NOTIFICATION_PUBLISHER } from '../../src/application/ports/tokens';
import type { NotificationPublisher } from '../../src/application/ports/notification-publisher';
import type { Notification } from '../../src/domain/notification';
import { configureApp } from '../../src/configure-app';
import { bullConnectionFromUrl } from '../../src/infrastructure/redis/redis.module';
import { SocketIoNotificationPublisher } from '../../src/infrastructure/ws/socket-io-notification-publisher';

export interface Instance {
  app: INestApplication;
  url: string;
  /** Notifications this instance's worker handed to its publisher (successful publishes only). */
  published: Notification[];
  /** Number of publish attempts, including failed ones. */
  attempts: { count: number };
}

/** Starts a full Nest app (worker + gateway + HTTP) on a random port against the given Redis. */
export async function startInstance(
  redisUrl: string,
  options: { failFirstPublishes?: number } = {},
): Promise<Instance> {
  const config = { redisUrl, port: 0 };
  const published: Notification[] = [];
  const attempts = { count: 0 };
  let toFail = options.failFirstPublishes ?? 0;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule.forRoot(config)] })
    // Wrap the real socket publisher to count (and optionally fail) publishes.
    .overrideProvider(NOTIFICATION_PUBLISHER)
    .useFactory({
      inject: [SocketIoNotificationPublisher],
      factory: (real: SocketIoNotificationPublisher): NotificationPublisher => ({
        publish(notification) {
          attempts.count++;
          if (toFail-- > 0) throw new Error('simulated publisher failure');
          real.publish(notification);
          published.push(notification);
        },
      }),
    })
    .compile();
  const app = moduleRef.createNestApplication();
  configureApp(app, config);
  await app.listen(0);
  return { app, url: await app.getUrl().then((u) => u.replace('[::1]', 'localhost')), published, attempts };
}

export function eventsQueue(redisUrl: string) {
  return new Queue(EVENTS_QUEUE, { connection: bullConnectionFromUrl(redisUrl) });
}

export async function connectClient(url: string, groupId: string | undefined) {
  const socket = io(url, {
    transports: ['websocket'],
    query: groupId === undefined ? {} : { groupId },
    reconnection: false,
  });
  const received: Notification[] = [];
  socket.on('notification', (n: Notification) => received.push(n));
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', reject);
  });
  return { socket, received };
}

export async function waitFor(condition: () => boolean | Promise<boolean>, timeoutMs = 15_000) {
  const start = Date.now();
  while (!(await condition())) {
    if (Date.now() - start > timeoutMs) throw new Error('waitFor timed out');
    await new Promise((r) => setTimeout(r, 25));
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
