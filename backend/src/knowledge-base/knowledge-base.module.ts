import { Module } from '@nestjs/common';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';
import { AiModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [AiModule, StorageModule, GatewayModule],
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
