// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { HelpdeskGateway } from '../gateway/gateway';
import { EmbedStatus } from '@prisma/client';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private readonly CHUNK_SIZE = 800;
  private readonly CHUNK_OVERLAP = 100;

  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
    private gateway: HelpdeskGateway,
  ) {}

  async processDocument(
    buffer: Buffer,
    filename: string,
    fileUrl: string,
    fileSize: number,
  ) {
    const doc = await this.prisma.knowledgeDocument.create({
      data: { filename, fileUrl, fileSize, status: EmbedStatus.PROCESSING },
    });

    this.gateway.emitToAll('embed:status', {
      docId: doc.id,
      status: EmbedStatus.PROCESSING,
    });

    this.runEmbedding(doc.id, buffer, filename).catch((err) => {
      this.logger.error(`Embedding failed for doc ${doc.id}`, err);
    });

    return doc;
  }

  private async runEmbedding(docId: string, buffer: Buffer, filename: string) {
    try {
      const pdfData = await pdfParse(buffer);
      const fullText = pdfData.text;
      const chunks = this.chunkText(fullText);

      this.logger.log(`Processing ${chunks.length} chunks for ${filename}`);

      for (const chunk of chunks) {
        const embedding = await this.gemini.generateEmbedding(chunk);
        const vectorLiteral = `[${embedding.join(',')}]`;

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO knowledge_chunks (id, content, source, "documentId", embedding, "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4::vector, NOW())`,
          chunk,
          filename,
          docId,
          vectorLiteral,
        );
      }

      await this.prisma.knowledgeDocument.update({
        where: { id: docId },
        data: { status: EmbedStatus.SUCCESS, chunkCount: chunks.length },
      });

      this.gateway.emitToAll('embed:status', {
        docId,
        status: EmbedStatus.SUCCESS,
        chunkCount: chunks.length,
      });
    } catch (err) {
      await this.prisma.knowledgeDocument.update({
        where: { id: docId },
        data: { status: EmbedStatus.FAILED },
      });
      this.gateway.emitToAll('embed:status', { docId, status: EmbedStatus.FAILED });
      throw err;
    }
  }

  private chunkText(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + this.CHUNK_SIZE, text.length);
      const chunk = text.slice(start, end).trim();
      if (chunk.length > 50) chunks.push(chunk);
      start += this.CHUNK_SIZE - this.CHUNK_OVERLAP;
    }
    return chunks;
  }

  async findAll() {
    return this.prisma.knowledgeDocument.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async delete(id: string) {
    return this.prisma.knowledgeDocument.delete({ where: { id } });
  }
}
