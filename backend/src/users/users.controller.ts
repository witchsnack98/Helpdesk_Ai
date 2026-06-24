import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(Role.AGENT, Role.ADMIN)
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id/history')
  @Roles(Role.AGENT, Role.ADMIN)
  getHistory(@Param('id') id: string) {
    return this.usersService.findCustomerHistory(id);
  }
}
