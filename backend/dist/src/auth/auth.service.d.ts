import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import type { Response } from 'express';
export declare class AuthService {
    private prisma;
    private jwt;
    private config;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
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
    getMe(userId: string): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        avatar: string | null;
        createdAt: Date;
    }>;
}
