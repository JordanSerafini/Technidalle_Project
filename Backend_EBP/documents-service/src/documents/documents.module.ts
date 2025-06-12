import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { Document } from '../entities/document.entity';
import { DocumentCategory } from '../entities/document-category.entity';
import { DocumentVersion } from '../entities/document-version.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentCategory, DocumentVersion]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {} 