import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/message.dto';
import { HelpdeskGateway } from '../gateway/gateway';
export declare class MessagesController {
    private messagesService;
    private gateway;
    constructor(messagesService: MessagesService, gateway: HelpdeskGateway);
    findAll(ticketId: string): Promise<({
        sender: {
            name: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        ticketId: string;
        content: string;
        senderId: string;
        isAI: boolean;
    })[]>;
    create(ticketId: string, dto: CreateMessageDto, user: {
        id: string;
    }): Promise<{
        sender: {
            name: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        ticketId: string;
        content: string;
        senderId: string;
        isAI: boolean;
    }>;
}
