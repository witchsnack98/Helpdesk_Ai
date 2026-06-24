import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { HelpdeskGateway } from '../gateway/gateway';
export declare class KnowledgeBaseService {
    private prisma;
    private gemini;
    private gateway;
    private readonly logger;
    private readonly CHUNK_SIZE;
    private readonly CHUNK_OVERLAP;
    constructor(prisma: PrismaService, gemini: GeminiService, gateway: HelpdeskGateway);
    processDocument(buffer: Buffer, filename: string, fileUrl: string, fileSize: number): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.EmbedStatus;
        createdAt: Date;
        updatedAt: Date;
        filename: string;
        fileUrl: string;
        fileSize: number;
        chunkCount: number | null;
    }>;
    private runEmbedding;
    private chunkText;
    findAll(): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.EmbedStatus;
        createdAt: Date;
        updatedAt: Date;
        filename: string;
        fileUrl: string;
        fileSize: number;
        chunkCount: number | null;
    }[]>;
    delete(id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.EmbedStatus;
        createdAt: Date;
        updatedAt: Date;
        filename: string;
        fileUrl: string;
        fileSize: number;
        chunkCount: number | null;
    }>;
}
