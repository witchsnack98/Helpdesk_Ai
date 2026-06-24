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
var KnowledgeBaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBaseService = void 0;
const pdfParse = require('pdf-parse');
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const gemini_service_1 = require("../ai/gemini.service");
const gateway_1 = require("../gateway/gateway");
const client_1 = require("@prisma/client");
let KnowledgeBaseService = KnowledgeBaseService_1 = class KnowledgeBaseService {
    prisma;
    gemini;
    gateway;
    logger = new common_1.Logger(KnowledgeBaseService_1.name);
    CHUNK_SIZE = 800;
    CHUNK_OVERLAP = 100;
    constructor(prisma, gemini, gateway) {
        this.prisma = prisma;
        this.gemini = gemini;
        this.gateway = gateway;
    }
    async processDocument(buffer, filename, fileUrl, fileSize) {
        const doc = await this.prisma.knowledgeDocument.create({
            data: { filename, fileUrl, fileSize, status: client_1.EmbedStatus.PROCESSING },
        });
        this.gateway.emitToAll('embed:status', {
            docId: doc.id,
            status: client_1.EmbedStatus.PROCESSING,
        });
        this.runEmbedding(doc.id, buffer, filename).catch((err) => {
            this.logger.error(`Embedding failed for doc ${doc.id}`, err);
        });
        return doc;
    }
    async runEmbedding(docId, buffer, filename) {
        try {
            const pdfData = await pdfParse(buffer);
            const fullText = pdfData.text;
            const chunks = this.chunkText(fullText);
            this.logger.log(`Processing ${chunks.length} chunks for ${filename}`);
            for (const chunk of chunks) {
                const embedding = await this.gemini.generateEmbedding(chunk);
                const vectorLiteral = `[${embedding.join(',')}]`;
                await this.prisma.$executeRawUnsafe(`INSERT INTO knowledge_chunks (id, content, source, "documentId", embedding, "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4::vector, NOW())`, chunk, filename, docId, vectorLiteral);
            }
            await this.prisma.knowledgeDocument.update({
                where: { id: docId },
                data: { status: client_1.EmbedStatus.SUCCESS, chunkCount: chunks.length },
            });
            this.gateway.emitToAll('embed:status', {
                docId,
                status: client_1.EmbedStatus.SUCCESS,
                chunkCount: chunks.length,
            });
        }
        catch (err) {
            await this.prisma.knowledgeDocument.update({
                where: { id: docId },
                data: { status: client_1.EmbedStatus.FAILED },
            });
            this.gateway.emitToAll('embed:status', { docId, status: client_1.EmbedStatus.FAILED });
            throw err;
        }
    }
    chunkText(text) {
        const chunks = [];
        let start = 0;
        while (start < text.length) {
            const end = Math.min(start + this.CHUNK_SIZE, text.length);
            const chunk = text.slice(start, end).trim();
            if (chunk.length > 50)
                chunks.push(chunk);
            start += this.CHUNK_SIZE - this.CHUNK_OVERLAP;
        }
        return chunks;
    }
    async findAll() {
        return this.prisma.knowledgeDocument.findMany({ orderBy: { createdAt: 'desc' } });
    }
    async delete(id) {
        return this.prisma.knowledgeDocument.delete({ where: { id } });
    }
};
exports.KnowledgeBaseService = KnowledgeBaseService;
exports.KnowledgeBaseService = KnowledgeBaseService = KnowledgeBaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gemini_service_1.GeminiService,
        gateway_1.HelpdeskGateway])
], KnowledgeBaseService);
//# sourceMappingURL=knowledge-base.service.js.map