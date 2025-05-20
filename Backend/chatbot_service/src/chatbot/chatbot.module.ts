import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { ConfigModule } from '@nestjs/config';
import { QueryBuilderModule } from '../querybuilder/querybuilder.module';

@Module({
  imports: [
    PrismaModule,
    EmbeddingModule,
    ConfigModule.forRoot(),
    QueryBuilderModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {} 