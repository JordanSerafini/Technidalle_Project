import { Module } from '@nestjs/common';import { ConfigModule } from '@nestjs/config';import { PrismaModule } from './prisma/prisma.module';import { EmbeddingModule } from './embedding/embedding.module';import { DataLoaderModule } from './data-loader/data-loader.module';import { ChatbotModule } from './chatbot/chatbot.module';import { QueryBuilderModule } from './querybuilder/querybuilder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    EmbeddingModule,
    DataLoaderModule,
    ChatbotModule,
    QueryBuilderModule,
  ],
})
export class AppModule {}
