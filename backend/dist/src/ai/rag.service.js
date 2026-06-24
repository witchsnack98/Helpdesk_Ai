"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RagService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const gemini_service_1 = require("./gemini.service");
let RagService = RagService_1 = class RagService {
    gemini;
    prisma;
    logger = new common_1.Logger(RagService_1.name);
    constructor(gemini, prisma) {
        this.gemini = gemini;
        this.prisma = prisma;
    }
    async query(question) {
        try {
            const queryEmbedding = await this.gemini.generateEmbedding(question);
            const vectorLiteral = `[${queryEmbedding.join(',')}]`;
            const chunks = await this.prisma.$queryRawUnsafe(`SELECT content, source
         FROM knowledge_chunks
         ORDER BY embedding <=> $1::vector
         LIMIT 5`, vectorLiteral);
            if (chunks.length === 0) {
                return "I don't have specific information about that in the knowledge base. Please contact our support team for assistance.";
            }
            const context = chunks
                .map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.content}`)
                .join('\n\n');
            const prompt = `You are a helpful customer support AI assistant. Answer the customer's question using ONLY the provided knowledge base context. If the answer is not in the context, say so honestly.

Knowledge Base Context:
${context}

Customer Question: "${question}"

Provide a clear, helpful answer in 2-4 sentences. If referencing specific information, mention the source document.`;
            return await this.gemini.generateText(prompt);
        }
        catch (err) {
            this.logger.error('RAG query failed', err);
            return 'I apologize, but I encountered an error. Please try again or contact support directly.';
        }
    }
};
exports.RagService = RagService;
exports.RagService = RagService = RagService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService,
        prisma_service_1.PrismaService])
], RagService);
//# sourceMappingURL=rag.service.js.map