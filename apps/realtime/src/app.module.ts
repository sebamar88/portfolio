import { BullModule } from '@nestjs/bullmq';
import { Logger, Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { EVENTS_QUEUE } from '@portfolio/events';
import type { Redis } from 'ioredis';
import type { NotificationPublisher } from './application/ports/notification-publisher';
import type { ProcessedEvents } from './application/ports/processed-events';
import type { PushSender, PushTokenStore } from './application/ports/push';
import {
  NOTIFICATION_PUBLISHER,
  PROCESSED_EVENTS,
  PUSH_SENDER,
  PUSH_TOKEN_STORE,
  REDIS,
} from './application/ports/tokens';
import { HandleDomainEvent } from './application/use-cases/handle-domain-event';
import { RegisterPushToken } from './application/use-cases/register-push-token';
import type { AppConfig } from './config';
import { HealthController } from './infrastructure/http/health.controller';
import { PushTokensController } from './infrastructure/http/push-tokens.controller';
import { RedisProcessedEvents } from './infrastructure/idempotency/redis-processed-events';
import { DomainEventsProcessor, PROCESSOR_LOGGER } from './infrastructure/queue/domain-events.processor';
import { ExpoPushSender } from './infrastructure/push/expo-push-sender';
import { RedisPushTokenStore } from './infrastructure/push/redis-push-token-store';
import { bullConnectionFromUrl, RedisModule } from './infrastructure/redis/redis.module';
import { RealtimeGateway } from './infrastructure/ws/realtime.gateway';
import { SocketIoNotificationPublisher } from './infrastructure/ws/socket-io-notification-publisher';

@Module({})
export class AppModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        BullModule.forRoot({ connection: bullConnectionFromUrl(config.redisUrl) }),
        BullModule.registerQueue({ name: EVENTS_QUEUE }),
        RedisModule.forConfig(config),
      ],
      controllers: [HealthController, PushTokensController],
      providers: [
        RealtimeGateway,
        SocketIoNotificationPublisher,
        { provide: NOTIFICATION_PUBLISHER, useExisting: SocketIoNotificationPublisher },
        {
          provide: PROCESSED_EVENTS,
          inject: [REDIS],
          useFactory: (redis: Redis) => new RedisProcessedEvents(redis),
        },
        {
          provide: PUSH_TOKEN_STORE,
          inject: [REDIS],
          useFactory: (redis: Redis) => new RedisPushTokenStore(redis),
        },
        {
          provide: PUSH_SENDER,
          useFactory: () => new ExpoPushSender(fetch, new Logger(ExpoPushSender.name)),
        },
        {
          provide: HandleDomainEvent,
          inject: [PROCESSED_EVENTS, NOTIFICATION_PUBLISHER, PUSH_TOKEN_STORE, PUSH_SENDER],
          useFactory: (
            processedEvents: ProcessedEvents,
            publisher: NotificationPublisher,
            pushTokens: PushTokenStore,
            pushSender: PushSender,
          ) =>
            new HandleDomainEvent({
              processedEvents,
              publisher,
              pushTokens,
              pushSender,
              logger: new Logger(HandleDomainEvent.name),
            }),
        },
        {
          provide: RegisterPushToken,
          inject: [PUSH_TOKEN_STORE],
          useFactory: (tokens: PushTokenStore) => new RegisterPushToken(tokens),
        },
        { provide: PROCESSOR_LOGGER, useValue: new Logger(DomainEventsProcessor.name) },
        DomainEventsProcessor,
      ],
    };
  }
}
