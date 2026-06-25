import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(ticketId: string, senderId: string, dto: CreateMessageDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.message.create({
      data: {
        content: dto.content,
        ticketId,
        senderId,
        isAI: dto.isAI ?? false,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });
  }

  async findByTicket(ticketId: string) {
    return this.prisma.message.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });
  }
}
