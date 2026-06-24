import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        avatar: string | null;
        createdAt: Date;
    }[]>;
    findById(id: string): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        avatar: string | null;
        createdAt: Date;
    }>;
    getHistory(id: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.Priority;
    }[]>;
}
