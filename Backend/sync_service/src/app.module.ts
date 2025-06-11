import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PgSyncController } from './pgToPg/pgSync.controller';
import { PgSyncService } from './pgToPg/pgSync.service';
import { EbpDocumentsController } from './controllers/ebpDocuments.controller';
import { EbpDocumentsService } from './services/ebpDocuments.service';
import { TruncateModule } from './truncate/truncate.module';
import { QueryService } from './services/query.service';
import { ClientSyncService } from './services/client-sync.service';
import { PgToAppSyncService } from './services/pg-to-app-sync.service';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [TruncateModule, SyncModule],
  controllers: [AppController, PgSyncController, EbpDocumentsController],
  providers: [
    AppService,
    QueryService,
    ClientSyncService,
    PgSyncService,
    EbpDocumentsService,
  ],
})
export class AppModule {}
