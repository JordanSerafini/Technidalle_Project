import { Controller, Get, Logger } from '@nestjs/common';
import { PgSyncService } from './pgSync.service';
import { Customer as ClientEBP } from '../interfaces/clientEBP';
import { CreateClientWithAddressDto } from '../interfaces/clientApp';

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
}
