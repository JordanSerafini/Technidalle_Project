import { Injectable, Logger } from '@nestjs/common';
import { QueryService } from './query.service';
import { EbpQueryService } from './ebp-query.service';
import { ClientSyncService } from './client-sync.service';
import { UnifiedProjectMapper } from '../sync/mappers/unified-project.mapper';
import { DocumentCompleteMapper } from '../sync/mappers/document-complete.mapper';
import { 
  SyncOptions, 
  SyncResult, 
  SyncError, 
  UnifiedEbpProject 
} from '../interfaces/sync/unified-project.interface';
import { 
  EbpCompleteDocument, 
  DocumentSyncOptions,
  DocumentSyncResult 
} from '../interfaces/sync/document-sync.interface';
import { DealInterface } from '../interfaces/Deal/deal.interface';
import { ConstructionsiteInterface } from '../interfaces/projects/constructionSite';
import { ItemAPP } from '../interfaces/items/itemAPP';

@Injectable()
export class UnifiedSyncService {
  private readonly logger = new Logger(UnifiedSyncService.name);

  constructor(
    private readonly queryService: QueryService, // Pour écrire dans la base destination
    private readonly ebpQueryService: EbpQueryService, // Pour lire depuis la base source EBP
    private readonly clientSyncService: ClientSyncService,
    private readonly projectMapper: UnifiedProjectMapper,
    private readonly documentMapper: DocumentCompleteMapper,
  ) {}

  /**
   * Synchronisation complète : Deals + Projects → Projects, Documents + Lines, Items → Materials
   */
  async syncComplete(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const defaultOptions: SyncOptions = {
      force_update: false,
      validate_clients: true,
      sync_documents: true,
      sync_items: true,
      batch_size: undefined,
      ...options
    };

    this.logger.log('Démarrage de la synchronisation complète EBP → Application');

    let totalProcessed = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    const errors: SyncError[] = [];

    try {
      // 1. Synchronisation des projets (Deals + ConstructionSites)
      this.logger.log('Étape 1: Synchronisation des projets unifiés');
      const projectsResult = await this.syncUnifiedProjects(defaultOptions);
      totalProcessed += projectsResult.processed;
      totalSucceeded += projectsResult.succeeded;
      totalFailed += projectsResult.failed;
      totalSkipped += projectsResult.skipped;
      errors.push(...projectsResult.errors);

      // 2. Synchronisation des matériaux (si demandé)
      if (defaultOptions.sync_items) {
        this.logger.log('Étape 2: Synchronisation des matériaux');
        const itemsResult = await this.syncItems(defaultOptions);
        totalProcessed += itemsResult.processed;
        totalSucceeded += itemsResult.succeeded;
        totalFailed += itemsResult.failed;
        totalSkipped += itemsResult.skipped;
        errors.push(...itemsResult.errors);
      }

      // 3. Synchronisation des documents complets (si demandé)
      if (defaultOptions.sync_documents) {
        this.logger.log('Étape 3: Synchronisation des documents avec lignes');
        const documentsResult = await this.syncCompleteDocuments(defaultOptions);
        totalProcessed += documentsResult.processed;
        totalSucceeded += documentsResult.succeeded;
        totalFailed += documentsResult.failed;
        totalSkipped += documentsResult.skipped;
        errors.push(...documentsResult.errors);
      }

      const duration = Date.now() - startTime;
      const success = totalFailed === 0;

      this.logger.log(
        `Synchronisation complète terminée: ${totalSucceeded}/${totalProcessed} réussies en ${duration}ms`
      );

      return {
        success,
        processed: totalProcessed,
        succeeded: totalSucceeded,
        failed: totalFailed,
        skipped: totalSkipped,
        errors,
        duration_ms: duration,
        details: `Synchronisation complète: ${totalSucceeded} succès, ${totalFailed} échecs, ${totalSkipped} ignorés`
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error('Erreur fatale lors de la synchronisation complète', error);
      
      return {
        success: false,
        processed: totalProcessed,
        succeeded: totalSucceeded,
        failed: totalFailed + 1,
        skipped: totalSkipped,
        errors: [
          ...errors,
          {
            entity_type: 'global',
            entity_id: 'sync_complete',
            error_code: 'FATAL_ERROR',
            error_message: errorMessage,
            context: { duration_ms: duration }
          }
        ],
        duration_ms: duration,
        details: `Erreur fatale: ${errorMessage}`
      };
    }
  }

  /**
   * Synchronise les projets unifiés (Deals + ConstructionSites)
   */
  private async syncUnifiedProjects(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;
    const errors: SyncError[] = [];

    try {
      // Récupérer tous les deals sans limitation
      const dealsQuery = `
        SELECT * FROM "Deal" 
        ORDER BY "sysModifiedDate" DESC
      `;
      const dealsResult = await this.ebpQueryService.executeQuery<DealInterface>(
        dealsQuery, 
        []
      );

      this.logger.log(`${dealsResult.rows.length} deals trouvés à synchroniser`);

      // Créer le mappeur pour les projets
      const projectMapper = UnifiedProjectMapper.getInstance();

      // Convertir en projets unifiés et synchroniser
      for (const deal of dealsResult.rows) {
        processed++;
        
        try {
          const unifiedProject = projectMapper.dealToUnified(deal);
          const result = await this.syncSingleUnifiedProject(unifiedProject, options);
          
          if (result.success) {
            succeeded++;
            this.logger.debug(`Deal ${deal.Id} synchronisé → projet ${result.projectId}`);
          } else {
            failed++;
            errors.push({
              entity_type: 'deal',
              entity_id: deal.Id,
              error_code: 'SYNC_FAILED',
              error_message: result.error || 'Erreur inconnue',
              context: deal
            });
          }
        } catch (error) {
          failed++;
          errors.push({
            entity_type: 'deal',
            entity_id: deal.Id,
            error_code: 'EXCEPTION',
            error_message: error instanceof Error ? error.message : String(error),
            context: deal
          });
        }
      }

    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation des projets unifiés', error);
      failed++;
      errors.push({
        entity_type: 'unified_projects',
        entity_id: 'batch',
        error_code: 'QUERY_ERROR',
        error_message: error instanceof Error ? error.message : String(error)
      });
    }

    return {
      success: failed === 0,
      processed,
      succeeded,
      failed,
      skipped,
      errors,
      duration_ms: Date.now() - startTime,
      details: `Projets unifiés: ${succeeded}/${processed} synchronisés`
    };
  }

  /**
   * Synchronise un projet unifié individuel
   */
  private async syncSingleUnifiedProject(
    unifiedProject: UnifiedEbpProject, 
    options: SyncOptions
  ): Promise<{ success: boolean; projectId?: number; error?: string }> {
    try {
      // 1. Synchroniser le client si nécessaire
      let clientId: number | undefined;
      if (options.validate_clients && unifiedProject.client_id) {
        const syncedClientId = await this.clientSyncService.syncClientByCustomerId(unifiedProject.client_id);
        clientId = syncedClientId ?? undefined; // Conversion null → undefined
      }

      // Si pas de client trouvé, créer un client par défaut ou utiliser un client générique
      if (!clientId) {
        try {
          // Vérifier s'il existe un client générique
          const genericClientQuery = `
            SELECT id FROM clients WHERE name = 'Client générique' LIMIT 1
          `;
          const genericClientResult = await this.queryService.executeQuery(genericClientQuery);
          
          if (genericClientResult.rows.length > 0) {
            clientId = genericClientResult.rows[0].id;
          } else {
            // Créer un client générique
            const createGenericClientQuery = `
              INSERT INTO clients (name, customer_id, email, created_at, updated_at)
              VALUES ('Client générique', 'GENERIC', 'generic@example.com', NOW(), NOW())
              RETURNING id
            `;
            const newClientResult = await this.queryService.executeQuery(createGenericClientQuery);
            clientId = newClientResult.rows[0].id;
            this.logger.warn(`Client générique créé avec l'ID ${clientId} pour le projet ${unifiedProject.id}`);
          }
        } catch (error) {
          this.logger.error(`Erreur lors de la création du client générique pour ${unifiedProject.id}:`, error);
          return { 
            success: false, 
            error: `Impossible de créer ou trouver un client pour le projet` 
          };
        }
      }

      // 2. Vérifier si le projet existe déjà (recherche plus exhaustive)
      const existingProjectQuery = `
        SELECT * FROM projects 
        WHERE (reference = $1 OR project_id = $1 OR project_id = $2 OR reference = $2)
        LIMIT 1
      `;
      const existingProjectResult = await this.queryService.executeQuery(
        existingProjectQuery, 
        [unifiedProject.deal_id, unifiedProject.id]
      );

      const existingProject = existingProjectResult.rows[0];

      // 3. Mapper le projet unifié
      const projectMapper = UnifiedProjectMapper.getInstance();
      const mappingResult = projectMapper.mapWithConflictDetection(
        unifiedProject,
        existingProject,
        clientId
      );

      // 4. Validation des dates avant insertion
      const startDate = mappingResult.app_project.start_date;
      const endDate = mappingResult.app_project.end_date;
      
      // Si la date de fin est antérieure à la date de début, on met la date de fin à null
      if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        this.logger.warn(
          `Date de fin (${endDate}) antérieure à la date de début (${startDate}) pour ${unifiedProject.id}. Date de fin mise à null.`
        );
        mappingResult.app_project.end_date = null;
      }

      // 5. Vérifier la confiance du mapping
      if (mappingResult.mapping_confidence < 0.5) {
        this.logger.warn(
          `Confiance mapping faible (${mappingResult.mapping_confidence}) pour ${unifiedProject.id}`
        );
        
        if (!options.force_update) {
          return { 
            success: false, 
            error: `Confiance mapping trop faible: ${mappingResult.mapping_confidence}` 
          };
        }
      }

      // 6. Insérer ou mettre à jour le projet
      let projectId: number;
      if (existingProject) {
        // Mise à jour
        const updateQuery = `
          UPDATE projects 
          SET name = $1, description = $2, client_id = $3, status = $4,
              start_date = $5, end_date = $6, budget = $7, actual_cost = $8,
              margin = $9, notes = $10, project_id = $11, updated_at = NOW()
          WHERE id = $12
          RETURNING id
        `;
        const updateParams = [
          mappingResult.app_project.name,
          mappingResult.app_project.description,
          clientId, // Utiliser le clientId résolu (jamais null)
          mappingResult.app_project.status,
          mappingResult.app_project.start_date,
          mappingResult.app_project.end_date, // Peut être null si dates incohérentes
          mappingResult.app_project.budget,
          mappingResult.app_project.actual_cost,
          mappingResult.app_project.margin,
          mappingResult.app_project.notes,
          mappingResult.app_project.reference,
          existingProject.id
        ];
        
        const updateResult = await this.queryService.executeQuery(updateQuery, updateParams);
        projectId = updateResult.rows[0].id;
        
      } else {
        // Insertion
        const insertQuery = `
          INSERT INTO projects (
            name, description, client_id, status, start_date, end_date,
            budget, actual_cost, margin, notes, project_id,
            reference, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          RETURNING id
        `;
        const insertParams = [
          mappingResult.app_project.name,
          mappingResult.app_project.description,
          clientId, // Utiliser le clientId résolu (jamais null)
          mappingResult.app_project.status,
          mappingResult.app_project.start_date,
          mappingResult.app_project.end_date, // Peut être null si dates incohérentes
          mappingResult.app_project.budget,
          mappingResult.app_project.actual_cost,
          mappingResult.app_project.margin,
          mappingResult.app_project.notes,
          mappingResult.app_project.reference,
          mappingResult.app_project.reference
        ];
        
        const insertResult = await this.queryService.executeQuery(insertQuery, insertParams);
        projectId = insertResult.rows[0].id;
      }

      return { success: true, projectId };

    } catch (error) {
      this.logger.error(`Erreur sync projet unifié ${unifiedProject.id}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * Synchronise les matériaux/items
   */
  private async syncItems(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: SyncError[] = [];

    try {
      // Récupérer tous les items EBP sans limitation
      const itemsQuery = `
        SELECT * FROM "Item" 
        ORDER BY "sysModifiedDate" DESC
      `;
      const itemsResult = await this.ebpQueryService.executeQuery(itemsQuery, []);

      this.logger.log(`${itemsResult.rows.length} items trouvés à synchroniser`);

      for (const ebpItem of itemsResult.rows) {
        processed++;
        
        try {
          const itemApp = ItemAPP.fromEBP(ebpItem);
          const itemData = itemApp.toDBObject();

          // S'assurer que le stock n'est pas négatif (contrainte DB)
          const stockQuantity = Math.max(0, itemData.stock_quantity || 0);

          // Vérifier si le matériau existe
          const existingQuery = `
            SELECT id FROM materials WHERE reference = $1 LIMIT 1
          `;
          const existingResult = await this.queryService.executeQuery(existingQuery, [itemData.reference]);

          if (existingResult.rows.length > 0) {
            // Mise à jour
            const updateQuery = `
              UPDATE materials 
              SET name = $1, description = $2, unit = $3, price = $4,
                  stock_quantity = $5, supplier = $6, updated_at = NOW()
              WHERE reference = $7
            `;
            await this.queryService.executeQuery(updateQuery, [
              itemData.name, itemData.description, itemData.unit, 
              itemData.price, stockQuantity, itemData.supplier,
              itemData.reference
            ]);
          } else {
            // Insertion
            const insertQuery = `
              INSERT INTO materials (
                name, description, reference, unit, price, 
                stock_quantity, supplier, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            `;
            await this.queryService.executeQuery(insertQuery, [
              itemData.name, itemData.description, itemData.reference,
              itemData.unit, itemData.price, stockQuantity, itemData.supplier
            ]);
          }

          succeeded++;

        } catch (error) {
          failed++;
          errors.push({
            entity_type: 'item',
            entity_id: ebpItem.Id || 'unknown',
            error_code: 'SYNC_ERROR',
            error_message: error instanceof Error ? error.message : String(error),
            context: ebpItem
          });
        }
      }

    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation des items', error);
      failed++;
      errors.push({
        entity_type: 'items',
        entity_id: 'batch',
        error_code: 'QUERY_ERROR',
        error_message: error instanceof Error ? error.message : String(error)
      });
    }

    return {
      success: failed === 0,
      processed,
      succeeded,
      failed,
      skipped: 0,
      errors,
      duration_ms: Date.now() - startTime,
      details: `Items: ${succeeded}/${processed} synchronisés`
    };
  }

  /**
   * Synchronise les documents complets avec leurs lignes
   */
  private async syncCompleteDocuments(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: SyncError[] = [];

    try {
      // Récupérer tous les documents avec leurs lignes (requête complexe)
      const documentsQuery = `
        SELECT 
          d.*,
          array_agg(
            json_build_object(
              'Id', dl."Id",
              'DocumentId', dl."DocumentId",
              'LineType', dl."LineType",
              'LineOrder', dl."LineOrder",
              'DescriptionClear', dl."DescriptionClear",
              'TechnicalDescriptionClear', dl."TechnicalDescriptionClear",
              'ItemId', dl."ItemId",
              'Quantity', dl."Quantity",
              'NetAmountVatExcludedWithDiscount', dl."NetAmountVatExcludedWithDiscount",
              'AmountVatExcluded', dl."AmountVatExcluded"
            ) ORDER BY dl."LineOrder"
          ) as lines
        FROM "DealSaleDocument" d
        LEFT JOIN "DealSaleDocumentLine" dl ON d."Id" = dl."DocumentId"
        WHERE d."DealId" IS NOT NULL
        GROUP BY d."Id"
        ORDER BY d."DocumentDate" DESC
      `;

      const documentsResult = await this.ebpQueryService.executeQuery(documentsQuery, []);

      for (const rawDoc of documentsResult.rows) {
        processed++;

        try {
          // Reconstituer le document complet
          const ebpCompleteDocument: EbpCompleteDocument = {
            document: rawDoc,
            lines: rawDoc.lines || [],
            deal_id: rawDoc.DealId,
            construction_site_id: rawDoc.ConstructionSiteId
          };

          // Trouver le projet correspondant
          const projectQuery = `
            SELECT id FROM projects 
            WHERE reference = $1 OR project_id = $2
            LIMIT 1
          `;
          const projectResult = await this.queryService.executeQuery(
            projectQuery, 
            [rawDoc.DealId, rawDoc.DealId]
          );

          if (projectResult.rows.length === 0) {
            errors.push({
              entity_type: 'document',
              entity_id: rawDoc.Id,
              error_code: 'PROJECT_NOT_FOUND',
              error_message: `Projet non trouvé pour le deal ${rawDoc.DealId}`,
              context: { dealId: rawDoc.DealId }
            });
            failed++;
            continue;
          }

          const projectId = projectResult.rows[0].id;

          // Mapper et synchroniser le document
          const syncResult = await this.syncSingleCompleteDocument(
            ebpCompleteDocument, 
            projectId,
            options
          );

          if (syncResult.document_id) {
            succeeded++;
          } else {
            failed++;
            errors.push({
              entity_type: 'document',
              entity_id: rawDoc.Id,
              error_code: 'DOCUMENT_SYNC_FAILED',
              error_message: syncResult.errors.join(', '),
              context: syncResult
            });
          }

        } catch (error) {
          failed++;
          errors.push({
            entity_type: 'document',
            entity_id: rawDoc.Id || 'unknown',
            error_code: 'EXCEPTION',
            error_message: error instanceof Error ? error.message : String(error),
            context: rawDoc
          });
        }
      }

    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation des documents', error);
      failed++;
      errors.push({
        entity_type: 'documents',
        entity_id: 'batch',
        error_code: 'QUERY_ERROR',
        error_message: error instanceof Error ? error.message : String(error)
      });
    }

    return {
      success: failed === 0,
      processed,
      succeeded,
      failed,
      skipped: 0,
      errors,
      duration_ms: Date.now() - startTime,
      details: `Documents: ${succeeded}/${processed} synchronisés`
    };
  }

  /**
   * Synchronise un document complet individuel
   */
  private async syncSingleCompleteDocument(
    ebpCompleteDocument: EbpCompleteDocument,
    projectId: number,
    options: SyncOptions
  ): Promise<DocumentSyncResult> {
    const result: DocumentSyncResult = {
      lines_created: 0,
      materials_created: 0,
      warnings: [],
      errors: [],
      skipped_lines: 0
    };

    try {
      // Mapper le document avec validation
      const documentMapping = this.documentMapper.mapWithValidation(
        ebpCompleteDocument,
        projectId
      );

      if (!documentMapping.validation_result.is_valid) {
        result.errors.push(
          ...documentMapping.validation_result.errors.map(e => e.message)
        );
        return result;
      }

      // Insérer le document
      const documentData = documentMapping.app_document.document;
      const insertDocQuery = `
        INSERT INTO documents (
          project_id, client_id, type, reference, status, amount,
          tva_rate, issue_date, payment_status, amount_paid, balance_due,
          notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING id
      `;

      const docResult = await this.queryService.executeQuery(insertDocQuery, [
        documentData.project_id,
        documentData.client_id,
        documentData.type,
        documentData.reference,
        documentData.status,
        documentData.amount,
        documentData.tva_rate,
        documentData.issue_date,
        documentData.payment_status,
        documentData.amount_paid,
        documentData.balance_due,
        documentData.notes
      ]);

      result.document_id = docResult.rows[0].id;

      // Insérer les lignes
      for (const lineData of documentMapping.app_document.lines) {
        try {
          // Résoudre le material_id si ItemId existe
          let materialId = null;
          if (lineData.material_id) {
            const materialQuery = `
              SELECT id FROM materials WHERE reference = $1 LIMIT 1
            `;
            const materialResult = await this.queryService.executeQuery(
              materialQuery, 
              [lineData.material_id]
            );
            if (materialResult.rows.length > 0) {
              materialId = materialResult.rows[0].id;
            }
          }

          const insertLineQuery = `
            INSERT INTO document_lines (
              document_id, material_id, description, quantity, unit,
              unit_price, discount_percent, discount_amount, tax_rate,
              sort_order, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          `;

          await this.queryService.executeQuery(insertLineQuery, [
            result.document_id,
            materialId,
            lineData.description,
            lineData.quantity,
            lineData.unit,
            lineData.unit_price,
            lineData.discount_percent,
            lineData.discount_amount,
            lineData.tax_rate,
            lineData.sort_order
          ]);

          result.lines_created++;

        } catch (error) {
          result.errors.push(`Ligne ${lineData.sort_order}: ${error}`);
          result.skipped_lines++;
        }
      }

      result.warnings.push(
        ...documentMapping.validation_result.warnings.map(w => w.message)
      );

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    return result;
  }

  // ========== MÉTHODES PUBLIQUES POUR SYNCHRONISATION SPÉCIALISÉE ==========

  /**
   * Synchronise uniquement les projets unifiés (Deals + ConstructionSites → Projects)
   */
  async syncProjectsOnly(options: SyncOptions = {}): Promise<SyncResult> {
    this.logger.log('Démarrage de la synchronisation des projets unifiés uniquement');
    return this.syncUnifiedProjects(options);
  }

  /**
   * Synchronise uniquement les matériaux (Items → Materials)
   */
  async syncItemsOnly(options: SyncOptions = {}): Promise<SyncResult> {
    this.logger.log('Démarrage de la synchronisation des matériaux uniquement');
    return this.syncItems(options);
  }

  /**
   * Synchronise uniquement les documents complets (Documents + Lines)
   */
  async syncDocumentsOnly(options: SyncOptions = {}): Promise<SyncResult> {
    this.logger.log('Démarrage de la synchronisation des documents uniquement');
    return this.syncCompleteDocuments(options);
  }

  /**
   * Retourne le statut de synchronisation actuel
   */
  async getSyncStatus(): Promise<{
    last_sync: Date | null;
    projects_count: number;
    documents_count: number;
    materials_count: number;
    deals_count: number;
  }> {
    try {
      // Compter les différents éléments synchronisés
      const [projectsResult, documentsResult, materialsResult, dealsResult] = await Promise.all([
        this.queryService.executeQuery('SELECT COUNT(*) as count FROM projects'),
        this.queryService.executeQuery('SELECT COUNT(*) as count FROM documents'),
        this.queryService.executeQuery('SELECT COUNT(*) as count FROM materials'),
        this.ebpQueryService.executeQuery('SELECT COUNT(*) as count FROM "Deal"')
      ]);

      // Récupérer la date de dernière modification la plus récente
      const lastSyncResult = await this.queryService.executeQuery(`
        SELECT MAX(updated_at) as last_sync 
        FROM (
          SELECT updated_at FROM projects
          UNION ALL
          SELECT updated_at FROM documents
          UNION ALL
          SELECT updated_at FROM materials
        ) as all_updates
      `);

      return {
        last_sync: lastSyncResult.rows[0]?.last_sync || null,
        projects_count: parseInt(projectsResult.rows[0].count) || 0,
        documents_count: parseInt(documentsResult.rows[0].count) || 0,
        materials_count: parseInt(materialsResult.rows[0].count) || 0,
        deals_count: parseInt(dealsResult.rows[0].count) || 0
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du statut de synchronisation', error);
      return {
        last_sync: null,
        projects_count: 0,
        documents_count: 0,
        materials_count: 0,
        deals_count: 0
      };
    }
  }
} 