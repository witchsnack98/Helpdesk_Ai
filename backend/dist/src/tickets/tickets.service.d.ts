import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, UpdateTicketDto, FilterTicketsDto } from './dto/ticket.dto';
export declare class TicketsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTicketDto, customerId: string): Promise<{
        customer: {
            name: string;
            email: string;
            id: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.Priority;
        category: string | null;
        sentiment: number | null;
        imageUrls: string[];
        customerId: string;
        agentId: string | null;
    }>;
    findAll(filter: FilterTicketsDto): Promise<({
        _count: {
            messages: number;
        };
        customer: {
            name: string;
            email: string;
            id: string;
            avatar: string | null;
        };
        agent: {
            name: string;
            email: string;
            id: string;
            avatar: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.Priority;
        category: string | null;
        sentiment: number | null;
        imageUrls: string[];
        customerId: string;
        agentId: string | null;
    })[]>;
    findMy(customerId: string): Promise<({
        _count: {
            messages: number;
        };
        agent: {
            name: string;
            id: string;
            avatar: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.Priority;
        category: string | null;
        sentiment: number | null;
        imageUrls: string[];
        customerId: string;
        agentId: string | null;
    })[]>;
    findOne(id: string, user: {
        id: string;
        role: string;
    }): Promise<{
        messages: ({
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
        })[];
        customer: {
            name: string;
            email: string;
            id: string;
            avatar: string | null;
            createdAt: Date;
        };
        agent: {
            name: string;
            email: string;
            id: string;
            avatar: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.Priority;
        category: string | null;
        sentiment: number | null;
        imageUrls: string[];
        customerId: string;
        agentId: string | null;
    }>;
    update(id: string, dto: UpdateTicketDto): Promise<{
        customer: {
            name: string;
            email: string;
            id: string;
            avatar: string | null;
        };
        agent: {
            name: string;
            email: string;
            id: string;
            avatar: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.Priority;
        category: string | null;
        sentiment: number | null;
        imageUrls: string[];
        customerId: string;
        agentId: string | null;
    }>;
    updateAiInsights(id: string, data: {
        category?: string;
        sentiment?: number;
        priority?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.Priority;
        category: string | null;
        sentiment: number | null;
        imageUrls: string[];
        customerId: string;
        agentId: string | null;
    }>;
    getStats(): Promise<{
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
        urgent: number;
    }>;
}
