import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatbotController } from './chatbot.controller';
import { AnalyzeController } from './analyze.controller';

@Module({
  imports: [
    HttpModule.register({
      baseURL: process.env.CHATBOT_SERVICE_URL || 'http://localhost:6655',
      timeout: 30000, // 30 secondes de timeout
      maxRedirects: 5,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  ],
  controllers: [ChatbotController, AnalyzeController],
})
export class ChatbotModule {}
