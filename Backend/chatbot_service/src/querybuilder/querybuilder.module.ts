import { Module } from '@nestjs/common';
import { QueryBuilderService } from './querybuilder.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [QueryBuilderService],
  exports: [QueryBuilderService],
})
export class QueryBuilderModule {}
