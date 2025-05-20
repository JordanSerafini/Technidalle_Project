import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  query: string;
  conversationHistory?: ChatMessage[];
}

@Controller('chatbot')
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('query')
  async query(@Body() chatRequest: ChatRequest) {
    this.logger.log(`Nouvelle requête reçue: "${chatRequest.query}"`);

    const result = await this.chatbotService.processQuery(
      chatRequest.query,
      chatRequest.conversationHistory || [],
    );

    return result;
  }

  @Get('details/:sourceType/:sourceId')
  async getDetails(
    @Param('sourceType') sourceType: string,
    @Param('sourceId', ParseIntPipe) sourceId: number,
  ) {
    this.logger.log(`Demande de détails pour ${sourceType} ID ${sourceId}`);

    const details = await this.chatbotService.getDetailedInfo(
      sourceType,
      sourceId,
    );

    return { details };
  }
}
