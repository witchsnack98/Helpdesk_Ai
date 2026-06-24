import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
  IsArray,
} from 'class-validator';
import { TicketStatus, Priority } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @IsArray()
  @IsOptional()
  imageUrls?: string[];
}

export class UpdateTicketDto {
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsString()
  @IsOptional()
  agentId?: string;

  @IsString()
  @IsOptional()
  category?: string;
}

export class FilterTicketsDto {
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  agentId?: string;
}
