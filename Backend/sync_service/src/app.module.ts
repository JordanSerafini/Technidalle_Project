import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PgSyncController } from './pgToPg/pgSync.controller';
import { PgSyncService } from './pgToPg/pgSync.service';

@Module({
  imports: [],
  controllers: [AppController, PgSyncController],
  providers: [AppService, PgSyncService],
})
export class AppModule {}
