import { Controller, Get, Post, Param, Logger, Res, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { UnifiedSyncService } from './services/unified-sync.service';
import { PgToAppSyncService } from './services/pg-to-app-sync.service';
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
    private readonly unifiedSyncService: UnifiedSyncService,
    private readonly pgToAppSyncService: PgToAppSyncService,
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

  // ================================
  // NOUVEAUX ENDPOINTS POSTGRES → APP
  // ================================

  @Post('sync/pg-to-app/complete')
  @ApiOperation({ summary: 'Synchronisation complète intelligente PostgreSQL Sync → App (avec validation et nettoyage automatique)' })
  @ApiResponse({ status: 200, description: 'Synchronisation réussie' })
  @ApiResponse({ status: 500, description: 'Erreur lors de la synchronisation' })
  async syncPgToAppComplete(): Promise<SyncOperationResponse> {
    try {
      this.logger.log('🚀 Démarrage de la synchronisation complète intelligente PostgreSQL Sync → App');
      
      const result = await this.pgToAppSyncService.syncComplete();
      
      return {
        success: result.success,
        message: result.success 
          ? `✅ Synchronisation PostgreSQL → App réussie: ${result.succeeded}/${result.processed} éléments en ${result.duration}ms`
          : `❌ Synchronisation PostgreSQL → App échouée: ${result.failed}/${result.processed} erreurs`,
        data: {
          summary: {
            processed: result.processed,
            succeeded: result.succeeded,
            failed: result.failed,
            duration_ms: result.duration,
            success_rate: result.processed > 0 ? Math.round((result.succeeded / result.processed) * 100) : 0
          },
          errors: result.errors.length > 0 ? result.errors.slice(0, 10) : []
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur fatale lors de la synchronisation PostgreSQL → App', error);
      return {
        success: false,
        message: 'Erreur fatale lors de la synchronisation PostgreSQL → App',
        error: (error as Error).message,
      };
    }
  }

  @Post('sync/pg-to-app/optimized')
  @ApiOperation({ summary: 'Synchronisation optimisée PostgreSQL Sync → App (ordre intelligent, gestion d\'erreurs améliorée)' })
  @ApiResponse({ status: 200, description: 'Synchronisation réussie' })
  @ApiResponse({ status: 500, description: 'Erreur lors de la synchronisation' })
  async syncPgToAppOptimized(): Promise<SyncOperationResponse> {
    try {
      this.logger.log('🚀 Démarrage de la synchronisation optimisée PostgreSQL Sync → App');
      
      const result = await this.pgToAppSyncService.syncCompleteOptimized();
      
      return {
        success: result.success,
        message: result.success 
          ? `✅ Synchronisation PostgreSQL → App réussie: ${result.succeeded}/${result.processed} éléments en ${result.duration}ms`
          : `❌ Synchronisation PostgreSQL → App échouée: ${result.failed}/${result.processed} erreurs`,
        data: {
          summary: {
            processed: result.processed,
            succeeded: result.succeeded,
            failed: result.failed,
            duration_ms: result.duration,
            success_rate: result.processed > 0 ? Math.round((result.succeeded / result.processed) * 100) : 0
          },
          errors: result.errors.length > 0 ? result.errors.slice(0, 10) : []
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur fatale lors de la synchronisation optimisée PostgreSQL → App', error);
      return {
        success: false,
        message: 'Erreur fatale lors de la synchronisation optimisée PostgreSQL → App',
        error: (error as Error).message,
      };
    }
  }

  @Post('sync/pg-to-app/clients')
  @ApiOperation({ summary: 'Synchronisation des clients PostgreSQL Sync → App' })
  async syncPgToAppClients(): Promise<SyncOperationResponse> {
    try {
      this.logger.log('📋 Synchronisation des clients PostgreSQL Sync → App');
      
      const result = await this.pgToAppSyncService.syncClients();
      
      return {
        success: result.success,
        message: result.success 
          ? `✅ Clients synchronisés: ${result.succeeded}/${result.processed} en ${result.duration}ms`
          : `❌ Erreur clients: ${result.failed}/${result.processed} erreurs`,
        data: {
          processed: result.processed,
          succeeded: result.succeeded,
          failed: result.failed,
          duration_ms: result.duration,
          errors: result.errors
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur lors de la synchronisation des clients', error);
      return {
        success: false,
        message: 'Erreur lors de la synchronisation des clients',
        error: (error as Error).message,
      };
    }
  }

  @Post('sync/pg-to-app/projects')
  @ApiOperation({ summary: 'Synchronisation des projets (Deals + ConstructionSite) PostgreSQL Sync → App' })
  async syncPgToAppProjects(): Promise<SyncOperationResponse> {
    try {
      this.logger.log('🏗️ Synchronisation des projets PostgreSQL Sync → App');
      
      const result = await this.pgToAppSyncService.syncProjects();
      
      return {
        success: result.success,
        message: result.success 
          ? `✅ Projets synchronisés: ${result.succeeded}/${result.processed} en ${result.duration}ms`
          : `❌ Erreur projets: ${result.failed}/${result.processed} erreurs`,
        data: {
          processed: result.processed,
          succeeded: result.succeeded,
          failed: result.failed,
          duration_ms: result.duration,
          errors: result.errors
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur lors de la synchronisation des projets', error);
      return {
        success: false,
        message: 'Erreur lors de la synchronisation des projets',
        error: (error as Error).message,
      };
    }
  }

  @Post('sync/pg-to-app/documents')
  @ApiOperation({ summary: 'Synchronisation des documents avec lignes PostgreSQL Sync → App' })
  async syncPgToAppDocuments(): Promise<SyncOperationResponse> {
    try {
      this.logger.log('📄 Synchronisation des documents avec lignes PostgreSQL Sync → App');
      
      const result = await this.pgToAppSyncService.syncDocuments();
      
      return {
        success: result.success,
        message: result.success 
          ? `✅ Documents synchronisés: ${result.succeeded}/${result.processed} en ${result.duration}ms`
          : `❌ Erreur documents: ${result.failed}/${result.processed} erreurs`,
        data: {
          processed: result.processed,
          succeeded: result.succeeded,
          failed: result.failed,
          duration_ms: result.duration,
          errors: result.errors
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur lors de la synchronisation des documents', error);
      return {
        success: false,
        message: 'Erreur lors de la synchronisation des documents',
        error: (error as Error).message,
      };
    }
  }

  @Post('sync/pg-to-app/materials')
  @ApiOperation({ summary: 'Synchronisation des matériaux PostgreSQL Sync → App' })
  async syncPgToAppMaterials(): Promise<SyncOperationResponse> {
    try {
      this.logger.log('📦 Synchronisation des matériaux PostgreSQL Sync → App');
      
      const result = await this.pgToAppSyncService.syncMaterials();
      
      return {
        success: result.success,
        message: result.success 
          ? `✅ Matériaux synchronisés: ${result.succeeded}/${result.processed} en ${result.duration}ms`
          : `❌ Erreur matériaux: ${result.failed}/${result.processed} erreurs`,
        data: {
          processed: result.processed,
          succeeded: result.succeeded,
          failed: result.failed,
          duration_ms: result.duration,
          errors: result.errors
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur lors de la synchronisation des matériaux', error);
      return {
        success: false,
        message: 'Erreur lors de la synchronisation des matériaux',
        error: (error as Error).message,
      };
    }
  }

  @Get('sync/pg-to-app/status')
  @ApiOperation({ summary: 'Statut de la synchronisation PostgreSQL Sync → App' })
  async getPgToAppSyncStatus(): Promise<SyncOperationResponse> {
    try {
      const status = await this.pgToAppSyncService.getSyncStatus();
      
      return {
        success: true,
        message: 'Statut de synchronisation PostgreSQL → App récupéré',
        data: {
          sync_status: status,
          available_endpoints: [
            'POST /sync/pg-to-app/complete',
            'POST /sync/pg-to-app/clients',
            'POST /sync/pg-to-app/projects',
            'POST /sync/pg-to-app/documents',
            'POST /sync/pg-to-app/materials',
            'POST /sync/pg-to-app/repair-documents',
            'GET /sync/pg-to-app/analyze-failures'
          ],
          service_info: {
            name: 'PostgreSQL Sync → App Service',
            version: '2.0.0',
            description: 'Service amélioré pour la synchronisation entre PostgreSQL Sync et PostgreSQL App'
          }
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération du statut PostgreSQL → App', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération du statut',
        error: (error as Error).message,
      };
    }
  }

  @Post('sync/pg-to-app/repair-documents')
  @ApiOperation({ summary: 'Répare les documents synchronisés sans lignes' })
  @ApiResponse({ status: 200, description: 'Réparation terminée' })
  @ApiResponse({ status: 500, description: 'Erreur lors de la réparation' })
  async repairDocumentsWithoutLines(): Promise<SyncOperationResponse> {
    try {
      this.logger.log('🔧 Démarrage de la réparation des documents sans lignes');
      
      const result = await this.pgToAppSyncService.repairDocumentsWithoutLines();
      
      return {
        success: result.success,
        message: result.success 
          ? `✅ Réparation terminée: ${result.documents_repaired}/${result.documents_analyzed} documents réparés`
          : `❌ Erreur lors de la réparation: ${result.errors.length} erreurs`,
        data: {
          summary: {
            documents_analyzed: result.documents_analyzed,
            documents_repaired: result.documents_repaired,
            lines_added: result.lines_added,
            success_rate: result.documents_analyzed > 0 
              ? Math.round((result.documents_repaired / result.documents_analyzed) * 100) 
              : 0
          },
          errors: result.errors
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur fatale lors de la réparation des documents', error);
      return {
        success: false,
        message: 'Erreur fatale lors de la réparation des documents',
        error: (error as Error).message,
      };
    }
  }

  @Get('sync/pg-to-app/analyze-failures')
  @ApiOperation({ summary: 'Analyse détaillée des échecs de synchronisation des documents' })
  @ApiResponse({ status: 200, description: 'Analyse complétée' })
  @ApiResponse({ status: 500, description: 'Erreur lors de l\'analyse' })
  async analyzeDocumentSyncFailures(): Promise<SyncOperationResponse> {
    try {
      this.logger.log('📊 Analyse des échecs de synchronisation des documents');
      
      const analysis = await this.pgToAppSyncService.analyzeDocumentSyncFailures();
      
      return {
        success: true,
        message: `📊 Analyse terminée: ${analysis.sync_rate}% de documents synchronisés`,
        data: {
          global_stats: {
            total_documents_in_sync: analysis.total_documents_in_sync,
            total_documents_in_app: analysis.total_documents_in_app,
            sync_rate: analysis.sync_rate,
            missing_documents: analysis.total_documents_in_sync - analysis.total_documents_in_app
          },
          quality_issues: {
            documents_without_lines: analysis.documents_without_lines,
            documents_with_zero_amount: analysis.documents_with_zero_amount,
            missing_projects: analysis.missing_projects
          },
          detailed_analysis: analysis.analysis,
          recommendations: [
            analysis.documents_without_lines > 0 ? 'Utiliser POST /sync/pg-to-app/repair-documents pour réparer les documents sans lignes' : null,
            analysis.sync_rate < 90 ? 'Relancer POST /sync/pg-to-app/documents pour améliorer le taux de synchronisation' : null,
            analysis.missing_projects > 0 ? 'Vérifier la synchronisation des projets avec POST /sync/pg-to-app/projects' : null
          ].filter(Boolean)
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'analyse des échecs de synchronisation', error);
      return {
        success: false,
        message: 'Erreur lors de l\'analyse des échecs de synchronisation',
        error: (error as Error).message,
      };
    }
  }

  @Post('sync/pg-to-app/cleanup-emails')
  @ApiOperation({ summary: 'Nettoyage et validation des emails clients' })
  @ApiResponse({ status: 200, description: 'Nettoyage terminé' })
  @ApiResponse({ status: 500, description: 'Erreur lors du nettoyage' })
  async cleanupEmailDuplicates(): Promise<SyncOperationResponse> {
    try {
      this.logger.log('🧹 Nettoyage des emails dupliqués et invalides');
      
      const result = await this.pgToAppSyncService.cleanupEmailDuplicates();
      
      return {
        success: result.success,
        message: result.success 
          ? `✅ ${result.message}`
          : `❌ Erreur lors du nettoyage`,
        data: {
          cleanup_stats: {
            duplicates_fixed: result.duplicates_fixed,
            invalid_emails_fixed: result.invalid_emails_fixed,
            invalid_phones_fixed: result.invalid_phones_fixed,
            normalized_count: result.normalized_count
          }
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur lors du nettoyage des emails', error);
      return {
        success: false,
        message: 'Erreur lors du nettoyage des emails',
        error: (error as Error).message,
      };
    }
  }
}
