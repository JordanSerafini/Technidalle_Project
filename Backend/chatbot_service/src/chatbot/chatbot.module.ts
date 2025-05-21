import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { AnalyzeAgentModule } from '../analyze_agent/analyze_agent.module';
import { QueryCacheService } from './query-cache.service';
import { LangchainModule } from '../langchain/langchain.module';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AnalyzeAgentModule,
    LangchainModule,
    ElasticsearchModule,
    PrismaModule,
    EmbeddingModule,
    ConfigModule.forRoot(),
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, QueryCacheService],
  exports: [ChatbotService, QueryCacheService],
})
export class ChatbotModule {}
