import { ConfigService } from '@nestjs/config';
export declare class StorageService {
    private config;
    private supabase;
    private readonly bucket;
    private readonly logger;
    constructor(config: ConfigService);
    uploadFile(buffer: Buffer, originalName: string, mimeType: string, folder?: string): Promise<string>;
    deleteFile(fileUrl: string): Promise<void>;
}
