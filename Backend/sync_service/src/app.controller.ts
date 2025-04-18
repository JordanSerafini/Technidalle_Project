import { Controller, Get, Post, Param, Logger } from '@nestjs/common';
import { AppService } from './app.service';

interface SyncOperationResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('tables')
  async getTables(): Promise<SyncOperationResponse> {
    try {
      const tables = await this.appService.getTables();
      return {
        success: true,
        message: 'Tables récupérées avec succès',
        data: tables,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des tables', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des tables',
        error: (error as Error).message,
      };
    }
  }

  @Post('create-tables')
  async createTables(): Promise<SyncOperationResponse> {
    try {
      await this.appService.createTables();
      return {
        success: true,
        message: 'Tables créées avec succès',
      };
    } catch (error) {
      this.logger.error('Erreur lors de la création des tables', error);
      return {
        success: false,
        message: 'Erreur lors de la création des tables',
        error: (error as Error).message,
      };
    }
  }

  @Post('sync-data-select')
  async syncData(): Promise<SyncOperationResponse> {
    try {
      await this.appService.insertDataFromMSSQLToPGSQLSelect();
      return {
        success: true,
        message: 'Données synchronisées avec succès',
      };
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation des données', error);
      return {
        success: false,
        message: 'Erreur lors de la synchronisation des données',
        error: (error as Error).message,
      };
    }
  }

  @Post('sync-data-all')
  async syncDataAll(): Promise<SyncOperationResponse> {
    try {
      await this.appService.insertDataFromMSSQLToPGSQL_ALL();
      return {
        success: true,
        message: 'Toutes les données synchronisées avec succès',
      };
    } catch (error) {
      this.logger.error(
        'Erreur lors de la synchronisation de toutes les données',
        error,
      );
      return {
        success: false,
        message: 'Erreur lors de la synchronisation de toutes les données',
        error: (error as Error).message,
      };
    }
  }

  @Get('columns/:tableName')
  async getColumns(
    @Param('tableName') tableName: string,
  ): Promise<SyncOperationResponse> {
    try {
      const columns = await this.appService.getExistingColumns(tableName);
      return {
        success: true,
        message: `Colonnes de la table ${tableName} récupérées avec succès`,
        data: columns,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des colonnes de la table ${tableName}`,
        error,
      );
      return {
        success: false,
        message: `Erreur lors de la récupération des colonnes de la table ${tableName}`,
        error: (error as Error).message,
      };
    }
  }

  @Post('drop-tables')
  async dropAllTables(): Promise<SyncOperationResponse> {
    try {
      await this.appService.dropAllTables();
      return {
        success: true,
        message: 'Toutes les tables ont été supprimées avec succès',
      };
    } catch (error) {
      this.logger.error('Erreur lors de la suppression des tables', error);
      return {
        success: false,
        message: 'Erreur lors de la suppression des tables',
        error: (error as Error).message,
      };
    }
  }

  @Post('truncate-tables')
  async truncateAllTables(): Promise<SyncOperationResponse> {
    try {
      await this.appService.truncateAllTables();
      return {
        success: true,
        message: 'Toutes les tables ont été vidées avec succès',
      };
    } catch (error) {
      this.logger.error('Erreur lors du vidage des tables', error);
      return {
        success: false,
        message: 'Erreur lors du vidage des tables',
        error: (error as Error).message,
      };
    }
  }

  @Get('truncate-table/:tableName')
  async truncateTable(
    @Param('tableName') tableName: string,
  ): Promise<SyncOperationResponse> {
    try {
      await this.appService.truncateTable(tableName);
      return {
        success: true,
        message: `La table ${tableName} a été vidée avec succès`,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors du vidage de la table ${tableName}`,
        error,
      );
      return {
        success: false,
        message: `Erreur lors du vidage de la table ${tableName}`,
        error: (error as Error).message,
      };
    }
  }

  @Post('full-sync')
  async fullSync(): Promise<SyncOperationResponse> {
    try {
      // Étape 1: Créer les tables dans PostgreSQL
      await this.appService.createTables();

      // Étape 2: Synchroniser les données
      await this.appService.insertDataFromMSSQLToPGSQL_ALL();

      return {
        success: true,
        message: 'Synchronisation complète réalisée avec succès',
      };
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation complète', error);
      return {
        success: false,
        message: 'Erreur lors de la synchronisation complète',
        error: (error as Error).message,
      };
    }
  }

  @Post('full-sync-select')
  async fullSyncSelect(): Promise<SyncOperationResponse> {
    try {
      // Étape 1: Créer les tables dans PostgreSQL
      await this.appService.createTables();

      // Étape 2: Synchroniser uniquement les tables sélectionnées
      await this.appService.insertDataFromMSSQLToPGSQLSelect();

      return {
        success: true,
        message: 'Synchronisation complète des tables sélectionnées réalisée avec succès',
      };
    } catch (error) {
      this.logger.error(
        'Erreur lors de la synchronisation complète des tables sélectionnées',
        error,
      );
      return {
        success: false,
        message: 'Erreur lors de la synchronisation complète des tables sélectionnées',
        error: (error as Error).message,
      };
    }
  }
}
