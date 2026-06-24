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
    findMy(user: {
        id: string;
    }): Promise<({
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
}
