import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class HelpdeskGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    afterInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinTicket(data: {
        ticketId: string;
    }, client: Socket): void;
    handleLeaveTicket(data: {
        ticketId: string;
    }, client: Socket): void;
    handleJoinAgents(client: Socket): void;
    handleTyping(data: {
        ticketId: string;
        userId: string;
        userName: string;
    }, client: Socket): void;
    emitToRoom(ticketId: string, event: string, data: any): void;
    emitToAgents(event: string, data: any): void;
    emitToAll(event: string, data: any): void;
}
