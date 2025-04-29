import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PgSyncController } from './pgToPg/pgSync.controller';
import { PgSyncService } from './pgToPg/pgSync.service';
import { EbpDocumentsController } from './controllers/ebpDocuments.controller';
import { EbpDocumentsService } from './services/ebpDocuments.service';

@Module({
  imports: [],
  controllers: [AppController, PgSyncController, EbpDocumentsController],
  providers: [AppService, PgSyncService, EbpDocumentsService],
})
export class AppModule {}
