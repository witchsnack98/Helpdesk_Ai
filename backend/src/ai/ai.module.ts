import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { TriageService } from './triage.service';
import { RagService } from './rag.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],
  providers: [GeminiService, TriageService, RagService],
  exports: [GeminiService, TriageService, RagService],
})
export class AiModule {}
