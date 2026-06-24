import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';
export declare class RagService {
    private gemini;
    private prisma;
    private readonly logger;
    constructor(gemini: GeminiService, prisma: PrismaService);
    query(question: string): Promise<string>;
}
