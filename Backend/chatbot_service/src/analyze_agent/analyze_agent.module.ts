import { Module } from '@nestjs/common';
import { AnalyzeAgentController } from './analyze_agent.controller';
import { AnalyzeAgentService } from './analyze_agent.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AnalyzeAgentController],
  providers: [AnalyzeAgentService],
  exports: [AnalyzeAgentService],
})
export class AnalyzeAgentModule {}
