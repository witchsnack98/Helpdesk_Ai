import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, UpdateTicketDto, FilterTicketsDto } from './dto/ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { HelpdeskGateway } from '../gateway/gateway';
import { TriageService } from '../ai/triage.service';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(
    private ticketsService: TicketsService,
    private gateway: HelpdeskGateway,
    private triageService: TriageService,
  ) {}

  @Post()
  @Roles(Role.CUSTOMER)
  async create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: { id: string },
  ) {
    // 1. Create ticket
    const ticket = await this.ticketsService.create(dto, user.id);

    // 2. Broadcast new ticket to all agents
    this.gateway.emitToAgents('ticket:new', ticket);

    // 3. Run AI Triage asynchronously (don't await, fire-and-forget)
    this.triageService.analyzeAndUpdate(ticket).then((triaged) => {
      if (triaged) {
        this.gateway.emitToAgents('ticket:triaged', {
          ticketId: ticket.id,
          priority: triaged.priority,
          category: triaged.category,
          sentiment: triaged.sentiment,
        });
      }
    });

    return ticket;
  }

  @Get()
  @Roles(Role.AGENT, Role.ADMIN)
  findAll(@Query() filter: FilterTicketsDto) {
    return this.ticketsService.findAll(filter);
  }

  @Get('my')
  @Roles(Role.CUSTOMER)
  findMy(@CurrentUser() user: { id: string }) {
    return this.ticketsService.findMy(user.id);
  }

  @Get('stats')
  @Roles(Role.AGENT, Role.ADMIN)
  getStats() {
    return this.ticketsService.getStats();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.ticketsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.AGENT, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    const updated = await this.ticketsService.update(id, dto);
    // Broadcast status change
    this.gateway.emitToRoom(id, 'ticket:updated', { ticketId: id, status: updated.status });
    return updated;
  }
}
