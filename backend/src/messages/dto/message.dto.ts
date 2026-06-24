import { IsString, MinLength, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @IsBoolean()
  @IsOptional()
  isAI?: boolean;
}
