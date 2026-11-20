import type { WarnLogger } from '../../application/ports/logger';
import type { PushSender } from '../../application/ports/push';
import type { Notification } from '../../domain/notification';

export const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_MESSAGES_PER_REQUEST = 100; // Expo's documented batch limit

interface ExpoTicket {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

export class ExpoPushSender implements PushSender {
  // fetch is injected so tests never touch the network.
  constructor(
    private readonly fetchFn: typeof fetch,
    private readonly logger: WarnLogger,
  ) {}

  async send(tokens: string[], notification: Notification): Promise<void> {
    for (let i = 0; i < tokens.length; i += MAX_MESSAGES_PER_REQUEST) {
      const batch = tokens.slice(i, i + MAX_MESSAGES_PER_REQUEST);
      const messages = batch.map((to) => ({
        to,
        title: notification.title,
        body: notification.body,
        data: { type: notification.type, groupId: notification.groupId, eventId: notification.event.id },
      }));
      const response = await this.fetchFn(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(messages),
      });
      if (!response.ok) throw new Error(`Expo push API answered HTTP ${response.status}`);

      const { data } = (await response.json()) as { data?: ExpoTicket[] };
      data?.forEach((ticket, index) => {
        if (ticket.status === 'error') {
          this.logger.warn(
            `Expo rejected a push to ${batch[index]}: ${ticket.details?.error ?? ticket.message ?? 'unknown error'}`,
          );
        }
      });
    }
  }
}
