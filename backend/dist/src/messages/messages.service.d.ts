import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/message.dto';
export declare class MessagesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(ticketId: string, senderId: string, dto: CreateMessageDto): Promise<{
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
    findByTicket(ticketId: string): Promise<({
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
}
