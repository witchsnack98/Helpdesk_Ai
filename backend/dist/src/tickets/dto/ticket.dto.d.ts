import { TicketStatus, Priority } from '@prisma/client';
export declare class CreateTicketDto {
    title: string;
    description: string;
    imageUrls?: string[];
}
export declare class UpdateTicketDto {
    status?: TicketStatus;
    priority?: Priority;
    agentId?: string;
    category?: string;
}
export declare class FilterTicketsDto {
    status?: TicketStatus;
    priority?: Priority;
    category?: string;
    search?: string;
    agentId?: string;
}
