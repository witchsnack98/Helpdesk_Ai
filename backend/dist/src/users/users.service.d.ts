import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        avatar: string | null;
        createdAt: Date;
    }>;
    findCustomerHistory(customerId: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.Priority;
    }[]>;
    findAll(): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        avatar: string | null;
        createdAt: Date;
    }[]>;
}
