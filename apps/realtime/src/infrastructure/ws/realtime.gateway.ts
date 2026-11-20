import { Logger } from '@nestjs/common';
import type { OnGatewayConnection } from '@nestjs/websockets';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { groupRoom } from '@portfolio/events';
import type { Server, Socket } from 'socket.io';

// Same port as the HTTP server. cors origin:true allows browser/web clients from any origin;
// restrict it once the web client's origin is known.
@WebSocketGateway({ cors: { origin: true } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const groupId = client.handshake.query.groupId;
    if (typeof groupId !== 'string' || groupId.trim() === '') {
      client.emit('exception', { message: 'groupId query parameter is required' });
      client.disconnect(true);
      return;
    }
    void client.join(groupRoom(groupId));
    this.logger.debug(`Client ${client.id} joined ${groupRoom(groupId)}`);
  }
}
