import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PgSyncController } from './pgToPg/pgSync.controller';
import { PgSyncService } from './pgToPg/pgSync.service';
import { TruncateModule } from './truncate/truncate.module';

@Module({
  imports: [TruncateModule],
  controllers: [AppController, PgSyncController],
  providers: [AppService, PgSyncService],
})
export class AppModule {}
