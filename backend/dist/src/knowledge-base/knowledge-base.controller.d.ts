import { KnowledgeBaseService } from './knowledge-base.service';
import { StorageService } from '../storage/storage.service';
export declare class KnowledgeBaseController {
    private kbService;
    private storageService;
    constructor(kbService: KnowledgeBaseService, storageService: StorageService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.EmbedStatus;
        filename: string;
        fileUrl: string;
        fileSize: number;
        chunkCount: number | null;
    }[]>;
    upload(file: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.EmbedStatus;
        filename: string;
        fileUrl: string;
        fileSize: number;
        chunkCount: number | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.EmbedStatus;
        filename: string;
        fileUrl: string;
        fileSize: number;
        chunkCount: number | null;
    }>;
}
