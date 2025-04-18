import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import pgClientDestination from '../clients/pgClient_2';

@Injectable()
export class TruncateService {
  private readonly logger = new Logger(TruncateService.name);

  /**
   * Liste des tables autorisées à être truncate
   */
  private readonly allowedTables = [
    'clients',
    'addresses',
    'quotes',
    'orders',
    'invoices',
    'products',
  ];

  /**
   * Vérifie si une table peut être truncate
   * @param tableName Nom de la table à vérifier
   * @throws HttpException si la table n'est pas autorisée
   */
  validateTable(tableName: string): void {
    if (!tableName) {
      throw new HttpException('Nom de table manquant', HttpStatus.BAD_REQUEST);
    }

    if (!this.allowedTables.includes(tableName)) {
      throw new HttpException(
        `Table non autorisée. Tables autorisées: ${this.allowedTables.join(', ')}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * Truncate une table spécifiée dans la base de données
   * @param tableName Nom de la table à truncate
   * @returns Objet indiquant le succès de l'opération
   */
  async truncateTable(tableName: string) {
    this.validateTable(tableName);

    try {
      // Désactiver temporairement les contraintes de clés étrangères
      await pgClientDestination.query('SET CONSTRAINTS ALL DEFERRED');

      // Exécuter TRUNCATE avec CASCADE pour supprimer les données liées
      await pgClientDestination.query(`TRUNCATE TABLE ${tableName} CASCADE`);

      // Réactiver les contraintes
      await pgClientDestination.query('SET CONSTRAINTS ALL IMMEDIATE');

      this.logger.log(`Table ${tableName} vidée avec succès`);

      return {
        success: true,
        message: `Table ${tableName} vidée avec succès`,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors du truncate de la table ${tableName}:`,
        error,
      );

      throw new HttpException(
        `Erreur lors du truncate de la table ${tableName}: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
