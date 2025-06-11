import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { EnhancedChatbotController } from './enhanced-chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { DatabaseService } from './database.service';
import { OpenaiService } from './openai.service';
import { EnhancedPromptsService } from './enhanced-prompts.service';
import { ConversationContextService } from './conversation-context.service';
import { ResponseFormatterService } from './response-formatter.service';

@Module({
  controllers: [ChatbotController, EnhancedChatbotController],
  providers: [
    ChatbotService, 
    DatabaseService, 
    OpenaiService,
    EnhancedPromptsService,
    ConversationContextService,
    ResponseFormatterService
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {} 