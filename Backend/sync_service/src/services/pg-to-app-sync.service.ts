import { Injectable, Logger } from '@nestjs/common';
import { QueryService } from './query.service';
import { ClientSyncService } from './client-sync.service';
import { pgClient } from '../clients/PgClient';
import pgClientApp from '../clients/pgClient_2';

interface SyncResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
  duration: number;
}

interface ClientMapping {
  sync_id: string;
  app_id?: number;
  name: string;
  email: string;
}

interface ProjectMapping {
  sync_deal_id: string;
  sync_project_id?: string;
  app_project_id?: number;
  client_app_id: number;
  name: string;
}

@Injectable()
export class PgToAppSyncService {
  private readonly logger = new Logger(PgToAppSyncService.name);

  constructor(
    private readonly queryService: QueryService,
    private readonly clientSyncService: ClientSyncService,
  ) {}

  /**
   * Synchronisation complète : Clients → Projets → Documents → Matériaux
   */
  async syncComplete(): Promise<SyncResult> {
    const startTime = Date.now();
    let totalProcessed = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    try {
      this.logger.log('🚀 Démarrage de la synchronisation PostgreSQL Sync → App');

      // 1. Synchroniser les clients
      this.logger.log('📋 Étape 1: Synchronisation des clients');
      const clientsResult = await this.syncClients();
      totalProcessed += clientsResult.processed;
      totalSucceeded += clientsResult.succeeded;
      totalFailed += clientsResult.failed;
      errors.push(...clientsResult.errors);

      // 2. Synchroniser les adresses
      this.logger.log('📍 Étape 2: Synchronisation des adresses');
      const addressesResult = await this.syncAddresses();
      totalProcessed += addressesResult.processed;
      totalSucceeded += addressesResult.succeeded;
      totalFailed += addressesResult.failed;
      errors.push(...addressesResult.errors);

      // 3. Synchroniser les projets (Deals → Projects)
      this.logger.log('🏗️ Étape 3: Synchronisation des projets');
      const projectsResult = await this.syncProjects();
      totalProcessed += projectsResult.processed;
      totalSucceeded += projectsResult.succeeded;
      totalFailed += projectsResult.failed;
      errors.push(...projectsResult.errors);

      // 4. Synchroniser les matériaux
      this.logger.log('📦 Étape 4: Synchronisation des matériaux');
      const materialsResult = await this.syncMaterials();
      totalProcessed += materialsResult.processed;
      totalSucceeded += materialsResult.succeeded;
      totalFailed += materialsResult.failed;
      errors.push(...materialsResult.errors);

      // 5. Synchroniser les documents
      this.logger.log('📄 Étape 5: Synchronisation des documents');
      const documentsResult = await this.syncDocuments();
      totalProcessed += documentsResult.processed;
      totalSucceeded += documentsResult.succeeded;
      totalFailed += documentsResult.failed;
      errors.push(...documentsResult.errors);

      const duration = Date.now() - startTime;
      const success = totalFailed === 0;

      this.logger.log(
        `✅ Synchronisation terminée: ${totalSucceeded}/${totalProcessed} réussies en ${duration}ms`
      );

      return {
        success,
        processed: totalProcessed,
        succeeded: totalSucceeded,
        failed: totalFailed,
        errors,
        duration,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('❌ Erreur fatale lors de la synchronisation', error);
      
      return {
        success: false,
        processed: totalProcessed,
        succeeded: totalSucceeded,
        failed: totalFailed + 1,
        errors: [...errors, `Erreur fatale: ${error instanceof Error ? error.message : String(error)}`],
        duration,
      };
    }
  }

  /**
   * Synchronise les clients depuis PostgreSQL Sync vers PostgreSQL App
   */
  async syncClients(): Promise<SyncResult> {
    const startTime = Date.now();
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    const client = await pgClientApp.getClient();
    
    try {
      await client.query('BEGIN');

      // Récupérer les clients depuis la base Sync
      const syncClients = await pgClient.query(`
        SELECT 
          "Id" as id,
          "Name" as name,
          COALESCE("MainInvoicingContact_FirstName", "MainDeliveryContact_FirstName", '') as firstname,
          COALESCE("MainInvoicingContact_Name", "MainDeliveryContact_Name", '') as lastname,
          CASE
            WHEN "MainInvoicingContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
            THEN "MainInvoicingContact_Email"
            WHEN "MainDeliveryContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
            THEN "MainDeliveryContact_Email"
            ELSE 'no-email-' || "Id" || '@technidalle.com'
          END as email,
          regexp_replace(COALESCE("MainInvoicingContact_Phone", "MainDeliveryContact_Phone", ''), '[^0-9+]', '', 'g') as phone,
          regexp_replace(COALESCE("MainInvoicingContact_CellPhone", "MainDeliveryContact_CellPhone", ''), '[^0-9+]', '', 'g') as mobile,
          "Siren" as siret,
          "NotesClear" as notes,
          "sysModifiedDate" as modified_date
        FROM "Customer" 
        WHERE "ActiveState" = 1 OR "ActiveState" IS NULL
        ORDER BY "sysModifiedDate" DESC NULLS LAST
      `);

      processed = syncClients.rows.length;
      this.logger.log(`${processed} clients à synchroniser`);

      // Insérer ou mettre à jour les clients dans la base App
      for (const syncClient of syncClients.rows) {
        try {
          const insertQuery = `
            INSERT INTO clients (
              customer_id, company_name, firstname, lastname, email, phone, mobile, siret, notes, 
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            ON CONFLICT (customer_id) DO UPDATE SET
              company_name = EXCLUDED.company_name,
              firstname = EXCLUDED.firstname,
              lastname = EXCLUDED.lastname,
              email = EXCLUDED.email,
              phone = EXCLUDED.phone,
              mobile = EXCLUDED.mobile,
              siret = EXCLUDED.siret,
              notes = EXCLUDED.notes,
              updated_at = NOW()
            RETURNING id
          `;

          const result = await client.query(insertQuery, [
            syncClient.id,
            syncClient.name || '',
            syncClient.firstname || '',
            syncClient.lastname || '',
            syncClient.email,
            syncClient.phone || null,
            syncClient.mobile || null,
            syncClient.siret || null,
            syncClient.notes || null,
          ]);

          succeeded++;
          this.logger.debug(`Client ${syncClient.id} synchronisé → app_id: ${result.rows[0]?.id}`);

        } catch (error) {
          failed++;
          const errorMsg = `Erreur client ${syncClient.id}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.warn(errorMsg);
        }
      }

      await client.query('COMMIT');
      this.logger.log(`✅ Clients: ${succeeded}/${processed} synchronisés`);

    } catch (error) {
      await client.query('ROLLBACK');
      const errorMsg = `Erreur lors de la synchronisation des clients: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      this.logger.error(errorMsg);
      failed = processed;

    } finally {
      client.release();
    }

    return {
      success: failed === 0,
      processed,
      succeeded,
      failed,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Synchronise les adresses depuis PostgreSQL Sync vers PostgreSQL App
   */
  async syncAddresses(): Promise<SyncResult> {
    const startTime = Date.now();
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    const client = await pgClientApp.getClient();
    
    try {
      await client.query('BEGIN');

      // Récupérer les adresses depuis la base Sync
      const syncAddresses = await pgClient.query(`
        SELECT DISTINCT
          "Id" as customer_id,
          NULLIF(TRIM("MainInvoicingAddress_Address1"), '') as street_name,
          NULLIF(TRIM("MainInvoicingAddress_ZipCode"), '') as zip_code,
          NULLIF(TRIM("MainInvoicingAddress_City"), '') as city,
          NULLIF(TRIM("MainInvoicingAddress_CountryIsoCode"), '') as country_code,
          'facturation' as address_type
        FROM "Customer" 
        WHERE NULLIF(TRIM("MainInvoicingAddress_Address1"), '') IS NOT NULL
          AND NULLIF(TRIM("MainInvoicingAddress_ZipCode"), '') IS NOT NULL
          AND NULLIF(TRIM("MainInvoicingAddress_City"), '') IS NOT NULL
        
        UNION
        
        SELECT DISTINCT
          "Id" as customer_id,
          NULLIF(TRIM("MainDeliveryAddress_Address1"), '') as street_name,
          NULLIF(TRIM("MainDeliveryAddress_ZipCode"), '') as zip_code,
          NULLIF(TRIM("MainDeliveryAddress_City"), '') as city,
          NULLIF(TRIM("MainDeliveryAddress_CountryIsoCode"), '') as country_code,
          'livraison' as address_type
        FROM "Customer"
        WHERE NULLIF(TRIM("MainDeliveryAddress_Address1"), '') IS NOT NULL
          AND NULLIF(TRIM("MainDeliveryAddress_ZipCode"), '') IS NOT NULL
          AND NULLIF(TRIM("MainDeliveryAddress_City"), '') IS NOT NULL
      `);

      processed = syncAddresses.rows.length;
      this.logger.log(`${processed} adresses à synchroniser`);

      for (const syncAddress of syncAddresses.rows) {
        try {
          // Vérifier si le client existe dans l'app
          const clientCheck = await client.query(
            'SELECT id FROM clients WHERE customer_id = $1',
            [syncAddress.customer_id]
          );

          if (clientCheck.rows.length === 0) {
            failed++;
            errors.push(`Client ${syncAddress.customer_id} non trouvé pour l'adresse`);
            continue;
          }

          const clientAppId = clientCheck.rows[0].id;

          // Insérer l'adresse
          const addressInsert = await client.query(`
            INSERT INTO addresses (street_name, zip_code, city, country, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            ON CONFLICT (street_name, zip_code, city) DO UPDATE SET updated_at = NOW()
            RETURNING id
          `, [
            syncAddress.street_name,
            syncAddress.zip_code,
            syncAddress.city,
            syncAddress.country_code || 'France'
          ]);

          const addressId = addressInsert.rows[0].id;

          // Lier l'adresse au client
          await client.query(`
            INSERT INTO client_addresses (client_id, address_id, address_type, is_default, created_at, updated_at)
            VALUES ($1, $2, $3, true, NOW(), NOW())
            ON CONFLICT (client_id, address_id, address_type) DO UPDATE SET updated_at = NOW()
          `, [clientAppId, addressId, syncAddress.address_type]);

          succeeded++;

        } catch (error) {
          failed++;
          const errorMsg = `Erreur adresse client ${syncAddress.customer_id}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.warn(errorMsg);
        }
      }

      await client.query('COMMIT');
      this.logger.log(`✅ Adresses: ${succeeded}/${processed} synchronisées`);

    } catch (error) {
      await client.query('ROLLBACK');
      const errorMsg = `Erreur lors de la synchronisation des adresses: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      this.logger.error(errorMsg);

    } finally {
      client.release();
    }

    return {
      success: failed === 0,
      processed,
      succeeded,
      failed,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Synchronise les projets (Deals + ConstructionSite) depuis PostgreSQL Sync vers PostgreSQL App
   */
  async syncProjects(): Promise<SyncResult> {
    const startTime = Date.now();
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    const client = await pgClientApp.getClient();
    
    try {
      await client.query('BEGIN');

      // 1. Récupérer les Deals depuis la base Sync
      const syncDeals = await pgClient.query(`
        SELECT 
          d."Id" as project_id,
          'DEAL' as source_type,
          d."Caption" as name,
          d."DealDate" as deal_date,
          d."xx_DateDebut" as start_date,
          d."xx_DateFin" as end_date,
          d."PredictedCosts" as predicted_costs,
          d."PredictedSales" as predicted_sales,
          d."AccomplishedSales" as budget,
          d."DealState" as deal_state,
          d."xx_Client" as client_ref,
          d."Notes" as notes,
          d."sysModifiedDate" as modified_date
        FROM "Deal" d
        WHERE d."Caption" IS NOT NULL
        ORDER BY d."sysModifiedDate" DESC NULLS LAST
      `);

      // 2. Récupérer les ConstructionSite depuis la base Sync
      const syncProjects = await pgClient.query(`
        SELECT 
          cs."Id" as project_id,
          'PROJECT' as source_type,
          cs."Caption" as name,
          cs."StartDate" as start_date,
          cs."EndDate" as end_date,
          cs."Budget" as budget,
          cs."State" as project_state,
          cs."CustomerId" as client_ref,
          cs."Description" as notes,
          cs."sysModifiedDate" as modified_date
        FROM "ConstructionSite" cs
        WHERE cs."Caption" IS NOT NULL
        ORDER BY cs."sysModifiedDate" DESC NULLS LAST
      `);

      // Combiner tous les projets
      const allProjects = [...syncDeals.rows, ...syncProjects.rows];
      processed = allProjects.length;
      this.logger.log(`${processed} projets (${syncDeals.rows.length} deals + ${syncProjects.rows.length} projets) à synchroniser`);

      for (const syncProject of allProjects) {
        try {
          // Chercher le client correspondant
          let clientAppId: number | null = null;

          if (syncProject.client_ref) {
            const clientSearch = await client.query(`
              SELECT id FROM clients 
              WHERE customer_id = $1 OR company_name ILIKE $2
              LIMIT 1
            `, [syncProject.client_ref, `%${syncProject.client_ref}%`]);

            if (clientSearch.rows.length > 0) {
              clientAppId = clientSearch.rows[0].id;
            }
          }

          // Si pas de client trouvé, créer un client par défaut
          if (!clientAppId) {
            const defaultClientResult = await client.query(`
              INSERT INTO clients (
                customer_id, company_name, firstname, lastname, email, 
                created_at, updated_at
              ) VALUES (
                $1, $2, 'Client', 'Inconnu', $3, NOW(), NOW()
              ) 
              ON CONFLICT (customer_id) DO UPDATE SET updated_at = NOW()
              RETURNING id
            `, [
              `${syncProject.source_type.toLowerCase()}-${syncProject.project_id}`,
              syncProject.client_ref || `Client du projet ${syncProject.name}`,
              `${syncProject.source_type.toLowerCase()}-${syncProject.project_id}@technidalle.com`
            ]);
            
            clientAppId = defaultClientResult.rows[0].id;
          }

          // Déterminer le statut du projet
          let status = 'prospect';
          const stateValue = syncProject.deal_state || syncProject.project_state;
          if (stateValue) {
            switch (stateValue) {
              case 1: status = 'devis_en_cours'; break;
              case 2: status = 'devis_accepte'; break;
              case 3: status = 'en_cours'; break;
              case 4: status = 'termine'; break;
              case 5: status = 'annule'; break;
              default: status = 'prospect';
            }
          }

          // Créer la référence unique pour éviter les conflits
          const reference = `${syncProject.source_type}-${syncProject.project_id}`;

          // Insérer le projet
          const projectInsert = await client.query(`
            INSERT INTO projects (
              client_id, name, reference, description, start_date, end_date, 
              budget, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            ON CONFLICT (reference) DO UPDATE SET
              client_id = EXCLUDED.client_id,
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              start_date = EXCLUDED.start_date,
              end_date = EXCLUDED.end_date,
              budget = EXCLUDED.budget,
              status = EXCLUDED.status,
              updated_at = NOW()
            RETURNING id
          `, [
            clientAppId,
            syncProject.name || `Projet ${syncProject.project_id}`,
            reference,
            syncProject.notes || null,
            syncProject.start_date || syncProject.deal_date || null,
            syncProject.end_date || null,
            syncProject.budget || syncProject.predicted_sales || null,
            status
          ]);

          succeeded++;
          this.logger.debug(`${syncProject.source_type} ${syncProject.project_id} synchronisé → app_id: ${projectInsert.rows[0].id}`);

        } catch (error) {
          failed++;
          const errorMsg = `Erreur projet ${syncProject.source_type} ${syncProject.project_id}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.warn(errorMsg);
        }
      }

      await client.query('COMMIT');
      this.logger.log(`✅ Projets: ${succeeded}/${processed} synchronisés`);

    } catch (error) {
      await client.query('ROLLBACK');
      const errorMsg = `Erreur lors de la synchronisation des projets: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      this.logger.error(errorMsg);

    } finally {
      client.release();
    }

    return {
      success: failed === 0,
      processed,
      succeeded,
      failed,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Synchronise les matériaux depuis PostgreSQL Sync vers PostgreSQL App
   */
  async syncMaterials(): Promise<SyncResult> {
    const startTime = Date.now();
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    const client = await pgClientApp.getClient();
    
    try {
      await client.query('BEGIN');

      // Récupérer les items depuis la base Sync
      const syncItems = await pgClient.query(`
        SELECT 
          i."Id" as item_id,
          i."Caption" as name,
          i."DesCom" as description,
          i."SalePriceVatExcluded" as sale_price,
          i."PurchasePrice" as purchase_price,
          i."RealStock" as stock_quantity,
          i."UnitId" as unit_ref,
          u."Caption" as unit_name,
          i."ActiveState" as active_state,
          i."sysModifiedDate" as modified_date
        FROM "Item" i
        LEFT JOIN "Unit" u ON i."UnitId" = u."Id"
        WHERE i."Caption" IS NOT NULL 
          AND (i."ActiveState" = 1 OR i."ActiveState" IS NULL)
        ORDER BY i."sysModifiedDate" DESC NULLS LAST
      `);

      processed = syncItems.rows.length;
      this.logger.log(`${processed} matériaux à synchroniser`);

      for (const syncItem of syncItems.rows) {
        try {
          const insertQuery = `
            INSERT INTO materials (
              reference, name, description, unit, price, stock_quantity, 
              minimum_stock, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            ON CONFLICT (reference) DO UPDATE SET
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              unit = EXCLUDED.unit,
              price = EXCLUDED.price,
              stock_quantity = EXCLUDED.stock_quantity,
              updated_at = NOW()
            RETURNING id
          `;

          await client.query(insertQuery, [
            syncItem.item_id,
            syncItem.name || '',
            syncItem.description || null,
            syncItem.unit_name || 'unité',
            syncItem.sale_price || syncItem.purchase_price || 0,
            Math.max(0, syncItem.stock_quantity || 0),
            0 // minimum_stock par défaut
          ]);

          succeeded++;

        } catch (error) {
          failed++;
          const errorMsg = `Erreur matériau ${syncItem.item_id}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.warn(errorMsg);
        }
      }

      await client.query('COMMIT');
      this.logger.log(`✅ Matériaux: ${succeeded}/${processed} synchronisés`);

    } catch (error) {
      await client.query('ROLLBACK');
      const errorMsg = `Erreur lors de la synchronisation des matériaux: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      this.logger.error(errorMsg);

    } finally {
      client.release();
    }

    return {
      success: failed === 0,
      processed,
      succeeded,
      failed,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Synchronise les documents avec leurs lignes depuis PostgreSQL Sync vers PostgreSQL App
   */
  async syncDocuments(): Promise<SyncResult> {
    const startTime = Date.now();
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    const client = await pgClientApp.getClient();
    
    try {
      await client.query('BEGIN');

      // 1. Récupérer les documents depuis la base Sync (SaleDocument)
      const syncDocuments = await pgClient.query(`
        SELECT 
          sd."Id" as document_id,
          sd."DocumentNumber" as reference,
          sd."DocumentDate" as issue_date,
          sd."DocumentType" as document_type,
          sd."CustomerId" as customer_id,
          sd."AmountVatExcluded" as amount_ht,
          sd."VatAmount" as vat_amount,
          sd."AmountVatIncluded" as amount_ttc,
          sd."DealId" as deal_id,
          sd."ValidationState" as validation_state,
          sd."Notes" as notes,
          sd."sysModifiedDate" as modified_date,
          'SALE' as document_source
        FROM "SaleDocument" sd
        WHERE sd."DocumentNumber" IS NOT NULL
        
        UNION ALL
        
        SELECT 
          csr."Id" as document_id,
          csr."Reference" as reference,
          csr."Date" as issue_date,
          csr."DocumentType" as document_type,
          cs."CustomerId" as customer_id,
          csr."AmountVatExcluded" as amount_ht,
          csr."VatAmount" as vat_amount,
          csr."AmountVatIncluded" as amount_ttc,
          cs."Id" as deal_id,
          csr."State" as validation_state,
          csr."Notes" as notes,
          csr."sysModifiedDate" as modified_date,
          'PROJECT' as document_source
        FROM "ConstructionSiteReferenceDocument" csr
        JOIN "ConstructionSite" cs ON csr."ConstructionSiteId" = cs."Id"
        WHERE csr."Reference" IS NOT NULL
        
        ORDER BY modified_date DESC NULLS LAST
      `);

      processed = syncDocuments.rows.length;
      this.logger.log(`${processed} documents à synchroniser`);

      for (const syncDoc of syncDocuments.rows) {
        try {
          // Chercher le projet correspondant selon la source
          let projectAppId: number | null = null;
          let searchReference = '';

          if (syncDoc.deal_id) {
            if (syncDoc.document_source === 'SALE') {
              searchReference = `DEAL-${syncDoc.deal_id}`;
            } else {
              searchReference = `PROJECT-${syncDoc.deal_id}`;
            }

            const projectSearch = await client.query(
              'SELECT id FROM projects WHERE reference = $1',
              [searchReference]
            );
            
            if (projectSearch.rows.length > 0) {
              projectAppId = projectSearch.rows[0].id;
            }
          }

          // Si pas de projet trouvé, chercher par client
          if (!projectAppId && syncDoc.customer_id) {
            const clientProjectSearch = await client.query(`
              SELECT p.id FROM projects p
              JOIN clients c ON p.client_id = c.id
              WHERE c.customer_id = $1
              ORDER BY p.created_at DESC
              LIMIT 1
            `, [syncDoc.customer_id]);

            if (clientProjectSearch.rows.length > 0) {
              projectAppId = clientProjectSearch.rows[0].id;
            }
          }

          if (!projectAppId) {
            failed++;
            errors.push(`Projet non trouvé pour le document ${syncDoc.reference} (source: ${syncDoc.document_source})`);
            continue;
          }

          // Déterminer le type de document
          let docType = 'autre';
          switch (syncDoc.document_type) {
            case 0: docType = 'devis'; break;
            case 1: docType = 'bon_de_commande'; break;
            case 2: docType = 'bon_de_livraison'; break;
            case 3: docType = 'facture'; break;
            case 4: docType = 'avoir'; break;
            default: docType = 'autre';
          }

          // Déterminer le statut
          let status = 'brouillon';
          switch (syncDoc.validation_state) {
            case 1: status = 'en_attente'; break;
            case 2: status = 'valide'; break;
            case 3: status = 'refuse'; break;
            default: status = 'brouillon';
          }

          // Insérer le document principal
          const documentInsert = await client.query(`
            INSERT INTO documents (
              project_id, reference, type, status, amount, tva_rate, 
              issue_date, notes, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            ON CONFLICT (reference) DO UPDATE SET
              project_id = EXCLUDED.project_id,
              type = EXCLUDED.type,
              status = EXCLUDED.status,
              amount = EXCLUDED.amount,
              issue_date = EXCLUDED.issue_date,
              notes = EXCLUDED.notes,
              updated_at = NOW()
            RETURNING id
          `, [
            projectAppId,
            syncDoc.reference,
            docType,
            status,
            syncDoc.amount_ht || 0,
            20.00, // TVA par défaut
            syncDoc.issue_date || new Date(),
            syncDoc.notes || null
          ]);

          const documentAppId = documentInsert.rows[0].id;

          // 2. Synchroniser les lignes de documents
          await this.syncDocumentLines(syncDoc, documentAppId, client);

          succeeded++;

        } catch (error) {
          failed++;
          const errorMsg = `Erreur document ${syncDoc.reference}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.warn(errorMsg);
        }
      }

      await client.query('COMMIT');
      this.logger.log(`✅ Documents: ${succeeded}/${processed} synchronisés`);

    } catch (error) {
      await client.query('ROLLBACK');
      const errorMsg = `Erreur lors de la synchronisation des documents: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      this.logger.error(errorMsg);

    } finally {
      client.release();
    }

    return {
      success: failed === 0,
      processed,
      succeeded,
      failed,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Synchronise les lignes d'un document avec les matériaux
   */
  private async syncDocumentLines(syncDoc: any, documentAppId: number, client: any): Promise<void> {
    try {
      let documentLines: any[] = [];

      // Récupérer les lignes selon la source du document
      if (syncDoc.document_source === 'SALE') {
        const saleDocumentLines = await pgClient.query(`
          SELECT 
            sdl."Id" as line_id,
            sdl."ItemId" as item_id,
            sdl."Description" as description,
            sdl."Quantity" as quantity,
            sdl."UnitPriceVatExcluded" as unit_price,
            sdl."DiscountRate" as discount_percent,
            sdl."AmountVatExcluded" as total_ht,
            i."Caption" as item_name,
            i."UnitId" as unit_ref,
            u."Caption" as unit_name
          FROM "SaleDocumentLine" sdl
          LEFT JOIN "Item" i ON sdl."ItemId" = i."Id"
          LEFT JOIN "Unit" u ON i."UnitId" = u."Id"
          WHERE sdl."DocumentId" = $1
          ORDER BY sdl."LineNumber"
        `, [syncDoc.document_id]);
        
        documentLines = saleDocumentLines.rows;
      } else {
        const projectDocumentLines = await pgClient.query(`
          SELECT 
            csrl."Id" as line_id,
            csrl."ItemId" as item_id,
            csrl."Description" as description,
            csrl."Quantity" as quantity,
            csrl."UnitPrice" as unit_price,
            csrl."DiscountRate" as discount_percent,
            csrl."Amount" as total_ht,
            i."Caption" as item_name,
            i."UnitId" as unit_ref,
            u."Caption" as unit_name
          FROM "ConstructionSiteReferenceDocumentLine" csrl
          LEFT JOIN "Item" i ON csrl."ItemId" = i."Id"
          LEFT JOIN "Unit" u ON i."UnitId" = u."Id"
          WHERE csrl."DocumentId" = $1
          ORDER BY csrl."LineNumber"
        `, [syncDoc.document_id]);
        
        documentLines = projectDocumentLines.rows;
      }

      // Insérer chaque ligne de document
      for (const line of documentLines) {
        try {
          // Chercher le matériau correspondant
          let materialId: number | null = null;
          
          if (line.item_id) {
            const materialSearch = await client.query(
              'SELECT id FROM materials WHERE reference = $1',
              [line.item_id]
            );
            
            if (materialSearch.rows.length > 0) {
              materialId = materialSearch.rows[0].id;
            }
          }

          // Insérer la ligne de document
          await client.query(`
            INSERT INTO document_lines (
              document_id, material_id, description, quantity, unit, 
              unit_price, discount_percent, tax_rate, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            ON CONFLICT (document_id, material_id) DO UPDATE SET
              description = EXCLUDED.description,
              quantity = EXCLUDED.quantity,
              unit = EXCLUDED.unit,
              unit_price = EXCLUDED.unit_price,
              discount_percent = EXCLUDED.discount_percent,
              updated_at = NOW()
          `, [
            documentAppId,
            materialId,
            line.description || line.item_name || 'Article non spécifié',
            line.quantity || 1,
            line.unit_name || 'unité',
            line.unit_price || 0,
            line.discount_percent || 0,
            20.00 // TVA par défaut
          ]);

        } catch (lineError) {
          this.logger.warn(`Erreur ligne document ${line.line_id}: ${lineError instanceof Error ? lineError.message : String(lineError)}`);
        }
      }

      this.logger.debug(`${documentLines.length} lignes synchronisées pour le document ${syncDoc.reference}`);

    } catch (error) {
      this.logger.error(`Erreur lors de la synchronisation des lignes du document ${syncDoc.reference}`, error);
      throw error;
    }
  }

  /**
   * Obtient le statut de la synchronisation
   */
  async getSyncStatus() {
    try {
      const appStats = await this.queryService.executeQuery(`
        SELECT 
          (SELECT COUNT(*) FROM clients) as clients_count,
          (SELECT COUNT(*) FROM projects) as projects_count,
          (SELECT COUNT(*) FROM documents) as documents_count,
          (SELECT COUNT(*) FROM materials) as materials_count,
          (SELECT COUNT(*) FROM addresses) as addresses_count
      `);

      const syncStats = await pgClient.query(`
        SELECT 
          (SELECT COUNT(*) FROM "Customer") as sync_customers_count,
          (SELECT COUNT(*) FROM "Deal") as sync_deals_count,
          (SELECT COUNT(*) FROM "SaleDocument") as sync_documents_count,
          (SELECT COUNT(*) FROM "Item") as sync_items_count
      `);

      return {
        app_database: appStats.rows[0],
        sync_database: syncStats.rows[0],
        last_check: new Date().toISOString(),
      };

    } catch (error) {
      this.logger.error('Erreur lors de la récupération du statut', error);
      throw error;
    }
  }
} 