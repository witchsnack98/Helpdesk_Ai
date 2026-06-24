import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { Priority } from '@prisma/client';
interface TriageResult {
    category: string;
    sentiment: number;
    priority: Priority;
    reasoning: string;
}
export declare class TriageService {
    private gemini;
    private prisma;
    private config;
    private readonly logger;
    constructor(gemini: GeminiService, prisma: PrismaService, config: ConfigService);
    analyzeAndUpdate(ticket: {
        id: string;
        title: string;
        description: string;
    }): Promise<{
        priority: Priority;
        category: string;
        sentiment: number;
    } | null>;
    analyze(title: string, description: string): Promise<TriageResult>;
    generateSuggestedReply(ticketTitle: string, ticketDescription: string, recentMessages: string[], category: string, sentiment: number): Promise<string>;
}
export {};
