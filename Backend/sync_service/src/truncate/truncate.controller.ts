import { Controller, Get, Param, Logger } from '@nestjs/common';
import { TruncateService } from './truncate.service';

@Controller('truncate')
export class TruncateController {
  private readonly logger = new Logger(TruncateController.name);

  constructor(private readonly truncateService: TruncateService) {}

  /**
   * Truncate une table spécifiée dans la base de données locale
   * @param tableName Nom de la table à truncate
   * @returns Résultat de l'opération
   */
  @Get(':tableName')
  async truncateTable(@Param('tableName') tableName: string) {
    this.logger.log(`Demande de truncate de la table ${tableName}`);
    return this.truncateService.truncateTable(tableName);
  }
}
