import { ConfigService } from '@nestjs/config';
import { AIProvider } from './interfaces/ai-provider.interface';
export declare class GeminiService implements AIProvider {
    private config;
    private readonly genAI;
    private readonly logger;
    constructor(config: ConfigService);
    generateText(prompt: string): Promise<string>;
    generateEmbedding(text: string): Promise<number[]>;
}
