import type { DomainEvent } from '@portfolio/events';
import type { Notification } from '../../domain/notification';

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

/**
 * Event -> client notification. The events only carry member ids, so for now the ids are used as
 * display names ("Ana added Dinner ($45.99)" when the id is "Ana").
 */
export function toNotification(event: DomainEvent): Notification {
  switch (event.type) {
    case 'expense.added': {
      const { payerId, description, amount, currency } = event.payload;
      return {
        type: event.type,
        groupId: event.groupId,
        title: 'New expense',
        body: `${payerId} added ${description} (${formatMoney(amount, currency)})`,
        event,
      };
    }
    case 'group.member_added':
      return {
        type: event.type,
        groupId: event.groupId,
        title: 'New member',
        body: `${event.payload.memberId} joined the group`,
        event,
      };
  }
}
