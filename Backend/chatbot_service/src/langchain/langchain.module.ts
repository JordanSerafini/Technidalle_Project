// src/langchain/langchain.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { LangchainController } from './langchain.controller';
import { ConfigModule } from '@nestjs/config';
import { AnalyzeAgentModule } from '../analyze_agent/analyze_agent.module';

@Module({
  imports: [ConfigModule, forwardRef(() => AnalyzeAgentModule)],
  controllers: [LangchainController],
  providers: [LangchainService],
  exports: [LangchainService],
})
export class LangchainModule {}
