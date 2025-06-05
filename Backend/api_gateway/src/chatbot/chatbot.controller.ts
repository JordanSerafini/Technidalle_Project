import { Controller, Get, Post, Body } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface ConversationMessageDto {
  userId: string;
  message: string;
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

  @Post('message')
  async sendMessage(@Body() body: ConversationMessageDto) {
    const { data } = await firstValueFrom(
      this.httpService.post('/chatbot/message', body),
    );
    return data;
  }
}
