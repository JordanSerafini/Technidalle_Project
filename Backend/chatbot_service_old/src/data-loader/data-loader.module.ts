import { Module } from '@nestjs/common';
import { DataLoaderService } from './data-loader.service';
import { DataLoaderController } from './data-loader.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
  imports: [PrismaModule, EmbeddingModule],
  controllers: [DataLoaderController],
  providers: [DataLoaderService],
  exports: [DataLoaderService],
})
export class DataLoaderModule {}
