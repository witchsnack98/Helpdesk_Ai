import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KnowledgeBaseService } from './knowledge-base.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { StorageService } from '../storage/storage.service';
import * as multer from 'multer';

@Controller('knowledge-base')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class KnowledgeBaseController {
  constructor(
    private kbService: KnowledgeBaseService,
    private storageService: StorageService,
  ) {}

  @Get()
  findAll() {
    return this.kbService.findAll();
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          cb(new BadRequestException('Only PDF files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    // Upload to Supabase Storage
    const fileUrl = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      'knowledge',
    );

    // Start processing (async embedding)
    const doc = await this.kbService.processDocument(
      file.buffer,
      file.originalname,
      fileUrl,
      file.size,
    );

    return doc;
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.kbService.delete(id);
  }
}
