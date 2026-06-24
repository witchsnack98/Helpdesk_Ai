import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { MessagesModule } from './messages/messages.module';
import { AiModule } from './ai/ai.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { StorageModule } from './storage/storage.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    // Config — make env vars available everywhere
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limiting — 100 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    // Core modules
    PrismaModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    MessagesModule,
    AiModule,
    KnowledgeBaseModule,
    StorageModule,
    GatewayModule,
  ],
})
export class AppModule {}
