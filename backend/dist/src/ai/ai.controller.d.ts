import { RagService } from './rag.service';
import { TriageService } from './triage.service';
import { PrismaService } from '../prisma/prisma.service';
declare class ChatDto {
    message: string;
}
declare class SuggestReplyDto {
    ticketId: string;
}
export declare class AiController {
    private ragService;
    private triageService;
    private prisma;
    constructor(ragService: RagService, triageService: TriageService, prisma: PrismaService);
    chat(dto: ChatDto): Promise<{
        answer: string;
    }>;
    suggestReply(dto: SuggestReplyDto): Promise<{
        reply: string;
    }>;
}
export {};
