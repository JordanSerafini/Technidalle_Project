import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { AnalyzeAgentModule } from '../analyze_agent/analyze_agent.module';
import { AnalyzeAgentService } from '../analyze_agent/analyze_agent.service';
import { QueryCacheService } from './query-cache.service';
import { LangchainModule } from '../langchain/langchain.module';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { ConfigModule } from '@nestjs/config';
import { QueryExecutorService } from '../analyze_agent/query-executor.service';

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
  providers: [
    ChatbotService,
    QueryCacheService,
    { provide: 'AnalyzeAgentService', useExisting: AnalyzeAgentService },
    { provide: 'QueryExecutorService', useExisting: QueryExecutorService },
  ],
  exports: [ChatbotService, QueryCacheService],
})
export class ChatbotModule {}
