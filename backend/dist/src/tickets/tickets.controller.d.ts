import { TicketsService } from './tickets.service';
import { CreateTicketDto, UpdateTicketDto, FilterTicketsDto } from './dto/ticket.dto';
import { HelpdeskGateway } from '../gateway/gateway';
import { TriageService } from '../ai/triage.service';
export declare class TicketsController {
    private ticketsService;
    private gateway;
    private triageService;
    constructor(ticketsService: TicketsService, gateway: HelpdeskGateway, triageService: TriageService);
    create(dto: CreateTicketDto, user: {
        id: string;
    }): Promise<{
        customer: {
            id: string;
            email: string;
            name: string;
            avatar: string | null;
        };
    } & {
        id: string;
        title: string;
        description: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.Priority;
        category: string | null;
        sentiment: number | null;
        imageUrls: string[];
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        agentId: string | null;
    }>;
    findAll(filter: FilterTicketsDto): Promise<({
        customer: {
            id: string;
            email: string;
            name: string;
            avatar: string | null;
        };
        agent: {
            id: string;
            email: string;
            name: string;
            avatar: string | null;
        } | null;
        _count: {
            messages: number;
        };
    } & {
        id: string;
        title: string;
        description: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.Priority;
        category: string | null;
        sentiment: number | null;
        imageUrls: string[];
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        agentId: string | null;
    })[]>;
    findMy(user: {
        id: string;
    }): Promise<({
        agent: {
            id: string;
            name: string;
            avatar: string | null;
        } | null;
        _count: {
            messages: number;
        };
    } & {
        id: string;
        title: string;
        description: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.Priority;
        category: string | null;
        sentiment: number | null;
        imageUrls: string[];
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        agentId: string | null;
    })[]>;
    getStats(): Promise<{
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
        urgent: number;
    }>;
    findOne(id: string, user: {
        id: string;
        role: string;
    }): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            email: string;
            name: string;
            avatar: string | null;
        };
        agent: {
            id: string;
            email: string;
            name: string;
            avatar: string | null;
        } | null;
        messages: ({
            sender: {
                id: string;
                name: string;
                role: import("@prisma/client").$Enums.Role;
                avatar: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            content: string;
            ticketId: string;
            senderId: string;
            isAI: boolean;
        })[];
    } & {
        id: string;
        title: string;
        description: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.Priority;
        category: string | null;
        sentiment: number | null;
        imageUrls: string[];
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        agentId: string | null;
    }>;
    update(id: string, dto: UpdateTicketDto): Promise<{
        customer: {
            id: string;
            email: string;
            name: string;
            avatar: string | null;
        };
        agent: {
            id: string;
            email: string;
            name: string;
            avatar: string | null;
        } | null;
    } & {
        id: string;
        title: string;
        description: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.Priority;
        category: string | null;
        sentiment: number | null;
        imageUrls: string[];
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        agentId: string | null;
    }>;
}
