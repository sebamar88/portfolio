import type { Notification } from '../../domain/notification';

/** Pushes a notification to every client interested in its group, on any instance. */
export interface NotificationPublisher {
  publish(notification: Notification): Promise<void> | void;
}
