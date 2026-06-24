import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        createdAt: Date;
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            avatar: string | null;
        };
    }>;
    logout(res: Response): {
        message: string;
    };
    getMe(user: {
        id: string;
    }): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        avatar: string | null;
        createdAt: Date;
    }>;
}
