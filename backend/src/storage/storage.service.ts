import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private readonly bucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL') || '',
      this.config.get<string>('SUPABASE_SERVICE_KEY') || '',
    );
    this.bucket = this.config.get<string>('SUPABASE_BUCKET') || 'helpdesk-attachments';
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'attachments',
  ): Promise<string> {
    const ext = path.extname(originalName);
    const filename = `${folder}/${uuidv4()}${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      this.logger.error('Upload failed', error);
      throw new Error(`File upload failed: ${error.message}`);
    }

    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(filename);

    return data.publicUrl;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // Extract path from full URL
    const urlParts = fileUrl.split(`/${this.bucket}/`);
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];
    await this.supabase.storage.from(this.bucket).remove([filePath]);
  }
}
