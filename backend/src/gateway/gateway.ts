import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class HelpdeskGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(HelpdeskGateway.name);

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Client joins a ticket room
  @SubscribeMessage('join:ticket')
  handleJoinTicket(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`ticket:${data.ticketId}`);
    this.logger.log(`Client ${client.id} joined ticket room: ${data.ticketId}`);
  }

  // Client leaves a ticket room
  @SubscribeMessage('leave:ticket')
  handleLeaveTicket(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`ticket:${data.ticketId}`);
  }

  // Agent joins the agents room
  @SubscribeMessage('join:agents')
  handleJoinAgents(@ConnectedSocket() client: Socket) {
    client.join('agents');
    this.logger.log(`Agent client ${client.id} joined agents room`);
  }

  // Typing indicator
  @SubscribeMessage('message:typing')
  handleTyping(
    @MessageBody() data: { ticketId: string; userId: string; userName: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`ticket:${data.ticketId}`).emit('message:typing', {
      userId: data.userId,
      userName: data.userName,
    });
  }

  // ─── Server-side emit helpers ───

  emitToRoom(ticketId: string, event: string, data: any) {
    this.server.to(`ticket:${ticketId}`).emit(event, data);
  }

  emitToAgents(event: string, data: any) {
    this.server.to('agents').emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
