import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HelpdeskGateway } from '../gateway/gateway';

@Controller('tickets/:ticketId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    private gateway: HelpdeskGateway,
  ) {}

  @Get()
  findAll(@Param('ticketId') ticketId: string) {
    return this.messagesService.findByTicket(ticketId);
  }

  @Post()
  async create(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: { id: string },
  ) {
    const message = await this.messagesService.create(ticketId, user.id, dto);
    // Broadcast to ticket room
    this.gateway.emitToRoom(ticketId, 'message:new', message);
    return message;
  }
}
