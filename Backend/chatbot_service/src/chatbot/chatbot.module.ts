import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { McpService } from './mcp.service';
import { OpenaiService } from './openai.service';

@Module({
  controllers: [ChatbotController],
  providers: [ChatbotService, McpService, OpenaiService],
  exports: [ChatbotService],
})
export class ChatbotModule {} 