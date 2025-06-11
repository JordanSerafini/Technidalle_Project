import { Controller, Get, Post, Param, Logger, Res, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { UnifiedSyncService } from './services/unified-sync.service';
import { Response } from 'express';
import { SyncOptions } from './interfaces/sync/unified-project.interface';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

interface SyncOperationResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly unifiedSyncService: UnifiedSyncService
  ) {}

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

  @Post('sync-part/:partNumber')
  async syncByPart(
    @Param('partNumber') partNumberParam: string,
  ): Promise<SyncOperationResponse> {
    try {
      const partNumber = parseInt(partNumberParam, 10);

      if (isNaN(partNumber) || partNumber < 1) {
        return {
          success: false,
          message:
            'Numéro de partie invalide. Doit être un nombre entier positif.',
        };
      }

      const totalParts = 10; // Nombre total de parties, peut être paramétré

      await this.appService.insertDataFromMSSQLToPGSQL_ByPart(
        partNumber,
        totalParts,
      );

      return {
        success: true,
        message: `Partie ${partNumber}/${totalParts} synchronisée avec succès`,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la synchronisation de la partie`,
        error,
      );
      return {
        success: false,
        message: `Erreur lors de la synchronisation de la partie`,
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
        message:
          'Synchronisation complète des tables sélectionnées réalisée avec succès',
      };
    } catch (error) {
      this.logger.error(
        'Erreur lors de la synchronisation complète des tables sélectionnées',
        error,
      );
      return {
        success: false,
        message:
          'Erreur lors de la synchronisation complète des tables sélectionnées',
        error: (error as Error).message,
      };
    }
  }

  @Get('generate-interface/:tableName')
  async generateInterface(
    @Param('tableName') tableName: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const interfaceString =
        await this.appService.generateInterfaceFromTable(tableName);
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send(interfaceString);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la génération de l'interface pour la table ${tableName}`,
        error,
      );
      const message =
        error instanceof Error && error.message.includes('non trouvée')
          ? `Table '${tableName}' non trouvée.`
          : `Erreur lors de la génération de l'interface pour la table ${tableName}`;
      res
        .status(
          error instanceof Error && error.message.includes('non trouvée')
            ? 404
            : 500,
        )
        .json({
          success: false,
          message: message,
          error: (error as Error).message,
        });
    }
  }

  // ========== NOUVEAUX ENDPOINTS SYNCHRONISATION UNIFIÉE ==========

  @Post('sync/unified/complete')
  async syncUnifiedComplete(@Body() options: Partial<SyncOptions> = {}): Promise<SyncOperationResponse> {
    try {
      this.logger.log('Démarrage de la synchronisation unifiée complète');
      
      // Configuration par défaut
      const defaultOptions: SyncOptions = {
        force_update: false,
        validate_clients: true,
        sync_documents: true,
        sync_items: true,
        batch_size: 100,
        ...options
      };

      // Exécuter la synchronisation complète
      const result = await this.unifiedSyncService.syncComplete(defaultOptions);
      
      return {
        success: result.success,
        message: result.success 
          ? `Synchronisation unifiée complète réussie: ${result.succeeded}/${result.processed} éléments synchronisés en ${result.duration_ms}ms`
          : `Synchronisation unifiée échouée: ${result.failed}/${result.processed} erreurs`,
        data: {
          options: defaultOptions,
          result: {
            processed: result.processed,
            succeeded: result.succeeded,
            failed: result.failed,
            skipped: result.skipped,
            duration_ms: result.duration_ms,
            details: result.details
          },
          errors: result.errors.length > 0 ? result.errors.slice(0, 10) : [] // Limiter les erreurs affichées
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation unifiée complète', error);
      return {
        success: false,
        message: 'Erreur lors de la synchronisation unifiée complète',
        error: (error as Error).message,
      };
    }
  }

  @Post('sync/unified/projects')
  async syncUnifiedProjects(@Body() options: Partial<SyncOptions> = {}): Promise<SyncOperationResponse> {
    try {
      this.logger.log('Démarrage de la synchronisation des projets unifiés');
      
      const projectOptions: SyncOptions = {
        force_update: false,
        validate_clients: true,
        sync_documents: false,
        sync_items: false,
        batch_size: 50,
        ...options
      };

      // Exécuter la synchronisation des projets uniquement
      const result = await this.unifiedSyncService.syncProjectsOnly(projectOptions);
      
      return {
        success: result.success,
        message: result.success 
          ? `Synchronisation des projets réussie: ${result.succeeded}/${result.processed} projets synchronisés en ${result.duration_ms}ms`
          : `Synchronisation des projets échouée: ${result.failed}/${result.processed} erreurs`,
        data: {
          options: projectOptions,
          result: {
            processed: result.processed,
            succeeded: result.succeeded,
            failed: result.failed,
            skipped: result.skipped,
            duration_ms: result.duration_ms,
            details: result.details
          },
          errors: result.errors.length > 0 ? result.errors.slice(0, 5) : []
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation des projets unifiés', error);
      return {
        success: false,
        message: 'Erreur lors de la synchronisation des projets unifiés',
        error: (error as Error).message,
      };
    }
  }

  @Post('sync/unified/documents')
  async syncUnifiedDocuments(@Body() options: Partial<SyncOptions> = {}): Promise<SyncOperationResponse> {
    try {
      this.logger.log('Démarrage de la synchronisation des documents complets');
      
      const docOptions: SyncOptions = {
        force_update: false,
        validate_clients: false,
        sync_documents: true,
        sync_items: false,
        batch_size: 30,
        ...options
      };

      // Exécuter la synchronisation des documents uniquement
      const result = await this.unifiedSyncService.syncDocumentsOnly(docOptions);
      
      return {
        success: result.success,
        message: result.success 
          ? `Synchronisation des documents réussie: ${result.succeeded}/${result.processed} documents synchronisés en ${result.duration_ms}ms`
          : `Synchronisation des documents échouée: ${result.failed}/${result.processed} erreurs`,
        data: {
          options: docOptions,
          result: {
            processed: result.processed,
            succeeded: result.succeeded,
            failed: result.failed,
            skipped: result.skipped,
            duration_ms: result.duration_ms,
            details: result.details
          },
          errors: result.errors.length > 0 ? result.errors.slice(0, 5) : []
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation des documents', error);
      return {
        success: false,
        message: 'Erreur lors de la synchronisation des documents',
        error: (error as Error).message,
      };
    }
  }

  @Post('sync/unified/items')
  async syncUnifiedItems(@Body() options: Partial<SyncOptions> = {}): Promise<SyncOperationResponse> {
    try {
      this.logger.log('Démarrage de la synchronisation des matériaux');
      
      const itemOptions: SyncOptions = {
        force_update: false,
        validate_clients: false,
        sync_documents: false,
        sync_items: true,
        batch_size: 200,
        ...options
      };

      // Exécuter la synchronisation des matériaux uniquement
      const result = await this.unifiedSyncService.syncItemsOnly(itemOptions);
      
      return {
        success: result.success,
        message: result.success 
          ? `Synchronisation des matériaux réussie: ${result.succeeded}/${result.processed} matériaux synchronisés en ${result.duration_ms}ms`
          : `Synchronisation des matériaux échouée: ${result.failed}/${result.processed} erreurs`,
        data: {
          options: itemOptions,
          result: {
            processed: result.processed,
            succeeded: result.succeeded,
            failed: result.failed,
            skipped: result.skipped,
            duration_ms: result.duration_ms,
            details: result.details
          },
          errors: result.errors.length > 0 ? result.errors.slice(0, 5) : []
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation des matériaux', error);
      return {
        success: false,
        message: 'Erreur lors de la synchronisation des matériaux',
        error: (error as Error).message,
      };
    }
  }

  @Get('sync/unified/status')
  async getUnifiedSyncStatus(): Promise<SyncOperationResponse> {
    try {
      // Récupérer le statut réel de synchronisation
      const status = await this.unifiedSyncService.getSyncStatus();
      
      return {
        success: true,
        message: 'Statut de la synchronisation unifiée récupéré avec succès',
        data: {
          last_sync: status.last_sync,
          projects_count: status.projects_count,
          documents_count: status.documents_count,
          materials_count: status.materials_count,
          deals_count: status.deals_count,
          service_status: 'operational',
          endpoints_available: [
            '/sync/unified/complete',
            '/sync/unified/projects', 
            '/sync/unified/documents',
            '/sync/unified/items'
          ]
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du statut', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération du statut de synchronisation',
        error: (error as Error).message,
      };
    }
  }
}
