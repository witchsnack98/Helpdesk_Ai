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

      let context = "No specific knowledge base context found.";
      if (chunks.length > 0) {
        context = chunks
          .map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.content}`)
          .join('\n\n');
      }

      const prompt = `You are a helpful customer support AI assistant.
IMPORTANT: You MUST answer the question in THAI language (ตอบเป็นภาษาไทยเสมอ).

Customer Question: "${question}"

Instructions:
1. Try to answer the question using the provided Knowledge Base Context. If you use the context, you can mention the source document.
2. If the context is empty, not relevant, or does not contain the answer, you MUST use your general knowledge to answer the question politely and helpfully.
3. Provide a clear and helpful answer in Thai.

Knowledge Base Context:
${context}`;

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
