import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { HelpdeskGateway } from '../gateway/gateway';
import { EmbedStatus } from '@prisma/client';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import * as fs from 'fs/promises';
import pdfParse from 'pdf-parse';

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

    this.runEmbedding(doc.id, buffer, filename).catch(async (err: Error) => {
      this.logger.error(`Embedding failed for doc ${doc.id}`, err);
      await fs.appendFile('error.log', (err?.stack || err.message) + '\n');
    });

    return doc;
  }

  private async runEmbedding(docId: string, buffer: Buffer, filename: string) {
    try {
      const pdfData = await pdfParse(buffer);
      const fullText = pdfData.text.replace(/\0/g, '');

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: this.CHUNK_SIZE,
        chunkOverlap: this.CHUNK_OVERLAP,
      });
      const chunkedDocs = await splitter.createDocuments([fullText]);
      const chunks = chunkedDocs
        .map((d) => d.pageContent)
        .filter((c) => c.length > 50);

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
      this.gateway.emitToAll('embed:status', {
        docId,
        status: EmbedStatus.FAILED,
      });
      throw err;
    }
  }

  async findAll() {
    return this.prisma.knowledgeDocument.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string) {
    return this.prisma.knowledgeDocument.delete({ where: { id } });
  }
}
