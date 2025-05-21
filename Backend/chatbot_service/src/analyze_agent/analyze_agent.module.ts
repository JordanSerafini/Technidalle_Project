import { Module } from '@nestjs/common';
import { AnalyzeAgentController } from './analyze_agent.controller';
import { AnalyzeAgentService } from './analyze_agent.service';
import { ConfigModule } from '@nestjs/config';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QueryExecutorService } from './query-executor.service';

@Module({
  imports: [ConfigModule.forRoot(), ElasticsearchModule, PrismaModule],
  controllers: [AnalyzeAgentController],
  providers: [AnalyzeAgentService, QueryExecutorService],
  exports: [AnalyzeAgentService, QueryExecutorService],
})
export class AnalyzeAgentModule {}
