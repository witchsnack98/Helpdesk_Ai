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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

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

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    server.use((socket, next) => {
      try {
        // Parse cookie header
        const cookieHeader = socket.handshake.headers.cookie;
        if (!cookieHeader) {
          return next(new Error('Authentication error: No cookies'));
        }

        const match = cookieHeader.match(/access_token=([^;]+)/);
        if (!match) {
          return next(new Error('Authentication error: No access token'));
        }

        const token = match[1];
        const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
        const payload = this.jwtService.verify(token, { secret });

        // Attach user info to socket
        (socket as any).user = payload;
        next();
      } catch (err) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  handleConnection(client: Socket) {
    const user = (client as any).user;
    this.logger.log(`Client connected: ${client.id} (User ID: ${user?.sub})`);
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
