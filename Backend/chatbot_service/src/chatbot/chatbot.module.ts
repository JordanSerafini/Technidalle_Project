import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { DatabaseService } from './database.service';
import { OpenaiService } from './openai.service';

@Module({
  controllers: [ChatbotController],
  providers: [ChatbotService, DatabaseService, OpenaiService],
  exports: [ChatbotService],
})
export class ChatbotModule {} 