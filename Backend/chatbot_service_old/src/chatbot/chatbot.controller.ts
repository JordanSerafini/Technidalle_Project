import { Controller, Get, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ConversationMessageDto } from '../analyze_agent/interface/interface';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get('health')
  async getHealth() {
    return this.chatbotService.getHealth();
  }

  @Post('message')
  async handleMessage(@Body() body: ConversationMessageDto) {
    const { userId, message } = body;
    const response = await this.chatbotService.handleUserMessage(userId, message);
    return { response };
  }
}
