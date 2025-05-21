import { Module } from '@nestjs/common';
import { AnalyzeAgentController } from './analyze_agent.controller';
import { AnalyzeAgentService } from './analyze_agent.service';
import { ConfigModule } from '@nestjs/config';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';

@Module({
  imports: [ConfigModule.forRoot(), ElasticsearchModule],
  controllers: [AnalyzeAgentController],
  providers: [AnalyzeAgentService],
  exports: [AnalyzeAgentService],
})
export class AnalyzeAgentModule {}
