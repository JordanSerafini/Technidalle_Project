import { Controller, Get } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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
}
