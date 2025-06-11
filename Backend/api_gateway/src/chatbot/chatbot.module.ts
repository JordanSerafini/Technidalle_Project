import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatbotController } from './chatbot.controller';
import { AnalyzeController } from './analyze.controller';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'http://chatbot:6655',
    }),
  ],
  controllers: [ChatbotController, AnalyzeController],
})
export class ChatbotModule {}
