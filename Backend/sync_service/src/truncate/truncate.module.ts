import { Module } from '@nestjs/common';
import { TruncateController } from './truncate.controller';
import { TruncateService } from './truncate.service';

@Module({
  controllers: [TruncateController],
  providers: [TruncateService],
  exports: [TruncateService],
})
export class TruncateModule {}
