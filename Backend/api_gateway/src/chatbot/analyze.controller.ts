import { Controller, Post, Body } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('analyze')
export class AnalyzeController {
  constructor(private readonly httpService: HttpService) {}

  @Post('chatbot')
  async analyzeChatbot(@Body() payload: any) {
    const { data } = await firstValueFrom(
      this.httpService.post('/analyze/chatbot', payload),
    );
    return data;
  }

  @Post('conversation')
  async analyzeConversation(@Body() payload: any) {
    const { data } = await firstValueFrom(
      this.httpService.post('/analyze/conversation', payload),
    );
    return data;
  }

  @Post('question')
  async analyzeQuestion(@Body() payload: any) {
    const { data } = await firstValueFrom(
      this.httpService.post('/analyze/question', payload),
    );
    return data;
  }

  @Post('execute-query')
  async executeQuery(@Body() payload: any) {
    const { data } = await firstValueFrom(
      this.httpService.post('/analyze/execute-query', payload),
    );
    return data;
  }
}
