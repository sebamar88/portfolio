import type { DomainEvent } from '@portfolio/events';
import type { ProcessedEvents } from '../../src/application/ports/processed-events';
import { toNotification } from '../../src/application/use-cases/to-notification';

export function fakeEvent(type: DomainEvent['type'], id = crypto.randomUUID()): DomainEvent {
  const base = { id, version: 1 as const, occurredAt: '2025-01-15T10:00:00.000Z', groupId: 'g1' };
  if (type === 'group.member_added') {
    return { ...base, type, payload: { memberId: 'Bob' } };
  }
  return {
    ...base,
    type,
    payload: {
      expenseId: 'e1',
      description: 'Dinner',
      amount: 4599,
      currency: 'USD',
      payerId: 'Ana',
      participantIds: ['Ana', 'Bob'],
    },
  };
}

export const notificationFor = toNotification;

export class InMemoryProcessedEvents implements ProcessedEvents {
  private readonly ids = new Set<string>();
  async claim(eventId: string) {
    if (this.ids.has(eventId)) return false;
    this.ids.add(eventId);
    return true;
  }
  async release(eventId: string) {
    this.ids.delete(eventId);
  }
}
