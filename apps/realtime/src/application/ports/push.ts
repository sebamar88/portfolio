import type { Notification } from '../../domain/notification';

/** Sends a push notification to device tokens (Expo push tokens). */
export interface PushSender {
  send(tokens: string[], notification: Notification): Promise<void>;
}

/** Device tokens registered per group. */
export interface PushTokenStore {
  add(groupId: string, token: string): Promise<void>;
  list(groupId: string): Promise<string[]>;
}
