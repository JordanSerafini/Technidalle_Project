import { Module } from '@nestjs/common';
import { VectorStoreService } from './vector-store.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot(),
  ],
  providers: [VectorStoreService],
  exports: [VectorStoreService],
})
export class EmbeddingModule {} 