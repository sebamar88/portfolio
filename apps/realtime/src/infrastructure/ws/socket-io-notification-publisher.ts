import { Injectable } from '@nestjs/common';
import { groupRoom } from '@portfolio/events';
import type { NotificationPublisher } from '../../application/ports/notification-publisher';
import type { Notification } from '../../domain/notification';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class SocketIoNotificationPublisher implements NotificationPublisher {
  constructor(private readonly gateway: RealtimeGateway) {}

  publish(notification: Notification): void {
    // With the Redis adapter, `to(room).emit` reaches the room's clients on every instance.
    this.gateway.server.to(groupRoom(notification.groupId)).emit('notification', notification);
  }
}
