import { Module } from '@nestjs/common';
import { DataLoaderService } from './data-loader.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
  imports: [PrismaModule, EmbeddingModule],
  providers: [DataLoaderService],
  exports: [DataLoaderService],
})
export class DataLoaderModule {} 