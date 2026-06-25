import { Controller, Post, Body, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RagService } from './rag.service';
import { TriageService } from './triage.service';
import { PrismaService } from '../prisma/prisma.service';
import { IsString } from 'class-validator';

class ChatDto {
  @IsString()
  message: string;
}

class SuggestReplyDto {
  @IsString()
  ticketId: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private ragService: RagService,
    private triageService: TriageService,
    private prisma: PrismaService,
  ) {}

  @Post('chat')
  async chat(@Body() dto: ChatDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const stream = this.ragService.queryStream(dto.message);
    for await (const chunk of stream) {
      res.write(chunk);
    }
    res.end();
  }

  @Post('suggest-reply')
  @Roles(Role.AGENT, Role.ADMIN)
  @UseGuards(RolesGuard)
  async suggestReply(@Body() dto: SuggestReplyDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: dto.ticketId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 4,
          include: {
            sender: { select: { name: true, role: true } },
          },
        },
      },
    });

    if (!ticket) return { reply: '' };

    const recentMessages = ticket.messages
      .reverse()
      .map((m) => `${m.sender.name} (${m.sender.role}): ${m.content}`);

    const reply = await this.triageService.generateSuggestedReply(
      ticket.title,
      ticket.description,
      recentMessages,
      ticket.category || 'General',
      ticket.sentiment ?? 0,
    );

    return { reply };
  }
}
