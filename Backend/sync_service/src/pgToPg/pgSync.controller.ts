import { Controller, Get, Logger } from '@nestjs/common';
import { PgSyncService } from './pgSync.service';

@Controller('sync')
export class PgSyncController {
  private readonly logger = new Logger(PgSyncController.name);

  constructor(private readonly pgSyncService: PgSyncService) {
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
}
