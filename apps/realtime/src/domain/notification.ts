import type { DomainEvent } from '@portfolio/events';

/** What a client receives on the `notification` socket event (and, as text, in a push). */
export interface Notification {
  type: DomainEvent['type'];
  groupId: string;
  title: string;
  body: string;
  event: DomainEvent;
}
