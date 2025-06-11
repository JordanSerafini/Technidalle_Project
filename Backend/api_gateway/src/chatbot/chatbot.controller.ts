import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface ChatRequest {
  message: string;
  conversationId?: string;
  database?: string;
  userId?: string;
}

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly httpService: HttpService) {}

  @Get('health')
  async getHealth() {
    const { data } = await firstValueFrom(
      this.httpService.get('/chatbot/health'),
    );
    return data;
  }

  @Post('chat')
  async sendMessage(@Body() body: ChatRequest) {
    const { data } = await firstValueFrom(
      this.httpService.post('/chatbot/chat', body),
    );
    return data;
  }

  @Get('conversation/:id/history')
  async getConversationHistory(@Param('id') conversationId: string) {
    const { data } = await firstValueFrom(
      this.httpService.get(`/chatbot/conversation/${conversationId}/history`),
    );
    return data;
  }

  @Delete('conversation/:id')
  async clearConversation(@Param('id') conversationId: string) {
    const { data } = await firstValueFrom(
      this.httpService.delete(`/chatbot/conversation/${conversationId}`),
    );
    return data;
  }

  @Get('databases/status')
  async getDatabaseStatus() {
    const { data } = await firstValueFrom(
      this.httpService.get('/chatbot/databases/status'),
    );
    return data;
  }
}
