import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private gemini: GeminiService,
    private prisma: PrismaService,
  ) {}

  async *queryStream(question: string): AsyncGenerator<string, void, unknown> {
    try {
      // 1. Embed the user question
      const queryEmbedding = await this.gemini.generateEmbedding(question);
      const vectorLiteral = `[${queryEmbedding.join(',')}]`;

      // 2. Vector similarity search via pgvector
      const chunks = await this.prisma.$queryRawUnsafe<
        Array<{ content: string; source: string }>
      >(
        `SELECT content, source
         FROM knowledge_chunks
         ORDER BY embedding <=> $1::vector
         LIMIT 5`,
        vectorLiteral,
      );

      if (chunks.length === 0) {
        yield 'ขออภัยค่ะ ฉันไม่มีข้อมูลเฉพาะเจาะจงเกี่ยวกับเรื่องนี้ในฐานข้อมูล โปรดติดต่อทีมสนับสนุนของเราเพื่อขอความช่วยเหลือค่ะ';
        return;
      }

      // 3. Build RAG prompt
      const context = chunks
        .map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.content}`)
        .join('\n\n');

      const prompt = `You are a helpful customer support AI assistant. Answer the customer's question using ONLY the provided knowledge base context. If the answer is not in the context, say so honestly.
IMPORTANT: You MUST answer the question in THAI language (ตอบเป็นภาษาไทยเสมอ).

Knowledge Base Context:
${context}

Customer Question: "${question}"

Provide a clear, helpful answer in Thai in 2-4 sentences. If referencing specific information, mention the source document.`;

      const stream = this.gemini.streamText(prompt);
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (err) {
      this.logger.error('RAG query failed', err);
      yield 'ขออภัยค่ะ เกิดข้อผิดพลาดขึ้นในระบบ โปรดลองใหม่อีกครั้ง หรือติดต่อฝ่ายสนับสนุนโดยตรงค่ะ';
    }
  }
}
