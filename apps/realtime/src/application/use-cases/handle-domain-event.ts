import type { DomainEvent } from '@portfolio/events';
import type { WarnLogger } from '../ports/logger';
import type { NotificationPublisher } from '../ports/notification-publisher';
import type { ProcessedEvents } from '../ports/processed-events';
import type { PushSender, PushTokenStore } from '../ports/push';
import { toNotification } from './to-notification';

export interface HandleDomainEventDeps {
  processedEvents: ProcessedEvents;
  publisher: NotificationPublisher;
  pushTokens: PushTokenStore;
  pushSender: PushSender;
  logger: WarnLogger;
}

export type HandleResult = 'delivered' | 'duplicate';

export class HandleDomainEvent {
  constructor(private readonly deps: HandleDomainEventDeps) {}

  async execute(event: DomainEvent): Promise<HandleResult> {
    const { processedEvents, publisher, logger } = this.deps;

    // Claim first: a duplicate (retry after a worker crash, event published twice) stops here.
    if (!(await processedEvents.claim(event.id))) return 'duplicate';

    const notification = toNotification(event);
    try {
      await publisher.publish(notification);
    } catch (error) {
      // Nothing was delivered: give the claim back so BullMQ's retry can try again.
      await processedEvents.release(event.id).catch(() => {});
      throw error;
    }

    // Push is best effort. The socket notification already went out and the claim stays, so
    // failing the job here would only produce a retry that is skipped as a duplicate.
    try {
      const tokens = await this.deps.pushTokens.list(event.groupId);
      if (tokens.length > 0) await this.deps.pushSender.send(tokens, notification);
    } catch (error) {
      logger.warn(`Push for event ${event.id} failed: ${errorMessage(error)}`);
    }
    return 'delivered';
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
