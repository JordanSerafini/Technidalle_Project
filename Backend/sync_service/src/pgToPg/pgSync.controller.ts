import { Controller, Get, Logger } from '@nestjs/common';
import { PgSyncService } from './pgSync.service';
import { SyncDealsService } from '../sync/sync-deals.service';

@Controller('sync')
export class PgSyncController {
  private readonly logger = new Logger(PgSyncController.name);

  constructor(
    private readonly pgSyncService: PgSyncService,
    private readonly syncDealsService: SyncDealsService,
  ) {
    this.logger.log('PgSyncController initialized');
  }

  @Get('sync-clients')
  async syncAllClients() {
    this.logger.log('Démarrage de la synchronisation des clients');
    return this.pgSyncService.syncAllClients();
  }

  @Get('sync-items')
  async syncAllItems() {
    this.logger.log('Démarrage de la synchronisation des articles');
    return await this.pgSyncService.syncAllItems();
  }

  @Get('sync-projects')
  async syncAllProjects() {
    this.logger.log('Démarrage de la synchronisation des projets');
    return await this.pgSyncService.syncAllProjects();
  }

  @Get('sync-documents')
  async syncDocuments() {
    this.logger.log('Démarrage de la synchronisation des documents');
    return await this.pgSyncService.syncDocuments();
  }

  @Get('sync-ebp-deals')
  async syncEbpDeals() {
    this.logger.log('Démarrage de la synchronisation des affaires EBP');
    return await this.syncDealsService.syncAllEbpData();
  }

  @Get('sync-deals')
  async syncDirectDeals() {
    this.logger.log('Démarrage de la synchronisation directe des affaires EBP');
    return await this.pgSyncService.syncAllEbpDeals();
  }
}
