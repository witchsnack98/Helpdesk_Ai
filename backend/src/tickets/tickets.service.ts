import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, UpdateTicketDto, FilterTicketsDto } from './dto/ticket.dto';
import { Role, TicketStatus, Prisma } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTicketDto, customerId: string) {
    const ticket = await this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        imageUrls: dto.imageUrls ?? [],
        customerId,
      },
      include: {
        customer: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
    return ticket;
  }

  async findAll(filter: FilterTicketsDto) {
    const where: Prisma.TicketWhereInput = {};

    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.category) where.category = filter.category;
    if (filter.agentId) where.agentId = filter.agentId;
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.ticket.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        customer: { select: { id: true, name: true, email: true, avatar: true } },
        agent: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { messages: true } },
      },
    });
  }

  async findMy(customerId: string) {
    return this.prisma.ticket.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        agent: { select: { id: true, name: true, avatar: true } },
        _count: { select: { messages: true } },
      },
    });
  }

  async findOne(id: string, user: { id: string; role: string }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
        agent: { select: { id: true, name: true, email: true, avatar: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, avatar: true, role: true } },
          },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    // Customers can only see their own tickets
    if (user.role === Role.CUSTOMER && ticket.customerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.ticket.update({
      where: { id },
      data: dto,
      include: {
        customer: { select: { id: true, name: true, email: true, avatar: true } },
        agent: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  async updateAiInsights(
    id: string,
    data: { category?: string; sentiment?: number; priority?: string },
  ) {
    return this.prisma.ticket.update({
      where: { id },
      data: {
        category: data.category,
        sentiment: data.sentiment,
        priority: data.priority as any,
      },
    });
  }

  async getStats() {
    const [total, open, inProgress, resolved, urgent] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: TicketStatus.OPEN } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.RESOLVED } }),
      this.prisma.ticket.count({ where: { priority: 'URGENT' } }),
    ]);
    return { total, open, inProgress, resolved, urgent };
  }
}
