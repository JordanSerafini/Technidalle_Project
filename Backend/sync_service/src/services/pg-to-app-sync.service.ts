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
      // Ne pas utiliser de transaction globale pour éviter le rollback en cascade
      // await client.query('BEGIN');

      // Récupérer les clients depuis la base Sync avec gestion avancée des emails
      const syncClients = await pgClient.query(`
        SELECT 
          "Id" as id,
          "Name" as name,
          COALESCE("MainInvoicingContact_FirstName", "MainDeliveryContact_FirstName", '') as firstname,
          COALESCE("MainInvoicingContact_Name", "MainDeliveryContact_Name", '') as lastname,
          CASE
            WHEN "MainInvoicingContact_Email" IS NOT NULL 
                 AND TRIM("MainInvoicingContact_Email") != '' 
                 AND "MainInvoicingContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
            THEN TRIM(LOWER("MainInvoicingContact_Email"))
            WHEN "MainDeliveryContact_Email" IS NOT NULL 
                 AND TRIM("MainDeliveryContact_Email") != '' 
                 AND "MainDeliveryContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
            THEN TRIM(LOWER("MainDeliveryContact_Email"))
            ELSE 'no-email-' || REPLACE("Id", ' ', '-') || '@technidalle.com'
          END as email,
          CASE 
            WHEN regexp_replace(COALESCE("MainInvoicingContact_Phone", "MainDeliveryContact_Phone", ''), '[^0-9+]', '', 'g') ~ '^[0-9+]{10,15}$'
            THEN regexp_replace(COALESCE("MainInvoicingContact_Phone", "MainDeliveryContact_Phone", ''), '[^0-9+]', '', 'g')
            ELSE NULL
          END as phone,
          CASE 
            WHEN regexp_replace(COALESCE("MainInvoicingContact_CellPhone", "MainDeliveryContact_CellPhone", ''), '[^0-9+]', '', 'g') ~ '^[0-9+]{10,15}$'
            THEN regexp_replace(COALESCE("MainInvoicingContact_CellPhone", "MainDeliveryContact_CellPhone", ''), '[^0-9+]', '', 'g')
            ELSE NULL
          END as mobile,
          "Siren" as siret,
          "NotesClear" as notes,
          "TechnicalSheetClear" as technical_sheet,
          "sysModifiedDate" as modified_date
        FROM "Customer" 
        WHERE "ActiveState" = 1 OR "ActiveState" IS NULL
        ORDER BY "sysModifiedDate" DESC NULLS LAST
      `);

      processed = syncClients.rows.length;
      this.logger.log(`${processed} clients à synchroniser`);

      // Map pour suivre les emails déjà traités et éviter les doublons
      const emailTracker = new Map<string, string>(); // email -> customer_id
      
      // Traiter chaque client individuellement (sans transaction globale)
      for (const syncClient of syncClients.rows) {
        // Transaction individuelle pour chaque client
        const individualClient = await pgClientApp.getClient();
        
        try {
          await individualClient.query('BEGIN');

          // Nettoyer et valider l'email
          let processedEmail = this.processEmailForClient(syncClient, emailTracker);
          
          // Nettoyer et valider le SIRET/SIREN
          let cleanSiret = null;
          if (syncClient.siret && syncClient.siret.trim()) {
            const siretClean = syncClient.siret.replace(/[^0-9]/g, '');
            // Accepter SIREN (9 chiffres) ou SIRET (14 chiffres)
            if (siretClean.length === 9 || siretClean.length === 14) {
              cleanSiret = siretClean;
            } else {
              this.logger.warn(`SIRET/SIREN invalide pour client ${syncClient.id}: ${syncClient.siret}`);
            }
          }

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

          const result = await individualClient.query(insertQuery, [
            syncClient.id,
            syncClient.name || '',
            syncClient.firstname || '',
            syncClient.lastname || '',
            processedEmail,
            syncClient.phone || null,
            syncClient.mobile || null,
            cleanSiret,
            syncClient.notes || null,
          ]);

          await individualClient.query('COMMIT');
          succeeded++;
          this.logger.debug(`Client ${syncClient.id} synchronisé → app_id: ${result.rows[0]?.id}`);

        } catch (error) {
          await individualClient.query('ROLLBACK');
          failed++;
          const errorMsg = `Erreur client ${syncClient.name || syncClient.id}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.warn(errorMsg);
        } finally {
          individualClient.release();
        }
      }
      this.logger.log(`✅ Clients: ${succeeded}/${processed} synchronisés`);

    } catch (error) {
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
   * Traite et valide l'email d'un client pour éviter les erreurs de contraintes
   */
  private processEmailForClient(syncClient: any, emailTracker: Map<string, string>): string {
    let email = syncClient.email || '';

    // 1. Valider le format de l'email avec une regex conforme à celle de la BD
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    
    if (!emailRegex.test(email)) {
      this.logger.warn(`Email invalide pour client ${syncClient.id}: ${email} → génération d'un email par défaut`);
      // Nettoyer l'ID client pour l'email (remplacer espaces et caractères spéciaux)
      const cleanId = syncClient.id.replace(/[^A-Za-z0-9]/g, '-').toLowerCase();
      email = `no-email-${cleanId}@technidalle.com`;
    }

    // 2. Nettoyer l'email (supprimer espaces, convertir en minuscules)
    email = email.trim().toLowerCase();

    // 3. Re-valider après nettoyage
    if (!emailRegex.test(email)) {
      const cleanId = syncClient.id.replace(/[^A-Za-z0-9]/g, '-').toLowerCase();
      email = `no-email-${cleanId}@technidalle.com`;
      this.logger.warn(`Email re-généré après nettoyage pour client ${syncClient.id}: ${email}`);
    }

    // 4. Gérer les doublons d'emails
    if (emailTracker.has(email)) {
      const existingCustomerId = emailTracker.get(email);
      this.logger.warn(`Email dupliqué détecté: ${email} (clients ${existingCustomerId} et ${syncClient.id})`);
      
      // Créer un email unique en ajoutant l'ID du client nettoyé
      const [localPart, domain] = email.split('@');
      const cleanId = syncClient.id.replace(/[^A-Za-z0-9]/g, '-').toLowerCase();
      email = `${localPart}-${cleanId}@${domain}`;
      
      this.logger.log(`Nouvel email généré pour éviter le doublon: ${email}`);
    }

    // 5. Ajouter l'email au tracker
    emailTracker.set(email, syncClient.id);

    return email;
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
      // Ne pas utiliser de transaction globale pour éviter le rollback en cascade
      // await client.query('BEGIN');

      // Récupérer les adresses depuis la base Sync avec les informations du client
      const syncAddresses = await pgClient.query(`
        SELECT DISTINCT
          c."Id" as customer_id,
          c."Name" as customer_name,
          COALESCE(c."MainInvoicingContact_Email", c."MainDeliveryContact_Email", 'no-email-' || c."Id" || '@technidalle.com') as customer_email,
          COALESCE(c."MainInvoicingContact_FirstName", c."MainDeliveryContact_FirstName", '') as customer_firstname,
          COALESCE(c."MainInvoicingContact_Name", c."MainDeliveryContact_Name", '') as customer_lastname,
          NULLIF(TRIM(c."MainInvoicingAddress_Address1"), '') as street_name,
          NULLIF(TRIM(c."MainInvoicingAddress_ZipCode"), '') as zip_code,
          NULLIF(TRIM(c."MainInvoicingAddress_City"), '') as city,
          NULLIF(TRIM(c."MainInvoicingAddress_CountryIsoCode"), '') as country_code,
          'facturation' as address_type
        FROM "Customer" c
        WHERE NULLIF(TRIM(c."MainInvoicingAddress_Address1"), '') IS NOT NULL
          AND NULLIF(TRIM(c."MainInvoicingAddress_ZipCode"), '') IS NOT NULL
          AND NULLIF(TRIM(c."MainInvoicingAddress_City"), '') IS NOT NULL
          AND (c."ActiveState" = 1 OR c."ActiveState" IS NULL)
        
        UNION
        
        SELECT DISTINCT
          c."Id" as customer_id,
          c."Name" as customer_name,
          COALESCE(c."MainInvoicingContact_Email", c."MainDeliveryContact_Email", 'no-email-' || c."Id" || '@technidalle.com') as customer_email,
          COALESCE(c."MainDeliveryContact_FirstName", c."MainInvoicingContact_FirstName", '') as customer_firstname,
          COALESCE(c."MainDeliveryContact_Name", c."MainInvoicingContact_Name", '') as customer_lastname,
          NULLIF(TRIM(c."MainDeliveryAddress_Address1"), '') as street_name,
          NULLIF(TRIM(c."MainDeliveryAddress_ZipCode"), '') as zip_code,
          NULLIF(TRIM(c."MainDeliveryAddress_City"), '') as city,
          NULLIF(TRIM(c."MainDeliveryAddress_CountryIsoCode"), '') as country_code,
          'livraison' as address_type
        FROM "Customer" c
        WHERE NULLIF(TRIM(c."MainDeliveryAddress_Address1"), '') IS NOT NULL
          AND NULLIF(TRIM(c."MainDeliveryAddress_ZipCode"), '') IS NOT NULL
          AND NULLIF(TRIM(c."MainDeliveryAddress_City"), '') IS NOT NULL
          AND (c."ActiveState" = 1 OR c."ActiveState" IS NULL)
      `);

      processed = syncAddresses.rows.length;
      this.logger.log(`${processed} adresses à synchroniser`);

      // Traiter chaque adresse individuellement (sans transaction globale)
      for (const syncAddress of syncAddresses.rows) {
        // Transaction individuelle pour chaque adresse
        const individualClient = await pgClientApp.getClient();
        
        try {
          await individualClient.query('BEGIN');

          // Vérifier si le client existe dans l'app, sinon le créer
          let clientCheck = await individualClient.query(
            'SELECT id FROM clients WHERE customer_id = $1',
            [syncAddress.customer_id]
          );

          let clientAppId: number;

          if (clientCheck.rows.length === 0) {
            // Client non trouvé, le créer automatiquement
            this.logger.debug(`Création automatique du client ${syncAddress.customer_id} pour l'adresse`);
            
            // Nettoyer et valider l'email
            const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
            let cleanEmail = syncAddress.customer_email?.trim()?.toLowerCase();
            if (!cleanEmail || !emailRegex.test(cleanEmail)) {
              cleanEmail = `no-email-${syncAddress.customer_id.replace(/[^a-zA-Z0-9]/g, '-')}@technidalle.com`;
            }

            const clientInsert = await individualClient.query(`
              INSERT INTO clients (
                customer_id, company_name, firstname, lastname, email, 
                created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
              ON CONFLICT (customer_id) DO UPDATE SET updated_at = NOW()
              RETURNING id
            `, [
              syncAddress.customer_id,
              syncAddress.customer_name || '',
              syncAddress.customer_firstname || '',
              syncAddress.customer_lastname || '',
              cleanEmail
            ]);

            clientAppId = clientInsert.rows[0].id;
          } else {
            clientAppId = clientCheck.rows[0].id;
          }

          // Insérer l'adresse avec la contrainte correcte
          const addressInsert = await individualClient.query(`
            INSERT INTO addresses (street_number, street_name, zip_code, city, country, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (street_number, street_name, zip_code, city) DO UPDATE SET 
              country = EXCLUDED.country,
              updated_at = NOW()
            RETURNING id
          `, [
            null, // street_number
            syncAddress.street_name,
            syncAddress.zip_code,
            syncAddress.city,
            syncAddress.country_code || 'France'
          ]);

          const addressId = addressInsert.rows[0].id;

          // Lier l'adresse au client
          await individualClient.query(`
            INSERT INTO client_addresses (client_id, address_id, address_type, is_default, created_at, updated_at)
            VALUES ($1, $2, $3, true, NOW(), NOW())
            ON CONFLICT (client_id, address_id, address_type) DO UPDATE SET 
              is_default = EXCLUDED.is_default,
              updated_at = NOW()
          `, [clientAppId, addressId, syncAddress.address_type]);

          await individualClient.query('COMMIT');
          succeeded++;
          this.logger.debug(`Adresse ${syncAddress.address_type} pour client ${syncAddress.customer_id} synchronisée → address_id: ${addressId}`);

        } catch (error) {
          await individualClient.query('ROLLBACK');
          failed++;
          const errorMsg = `Erreur adresse client ${syncAddress.customer_id}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.warn(errorMsg);
        } finally {
          individualClient.release();
        }
      }

      this.logger.log(`✅ Adresses: ${succeeded}/${processed} synchronisées`);

    } catch (error) {
      const errorMsg = `Erreur lors de la synchronisation des adresses: ${error instanceof Error ? error.message : String(error)}`;
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
      // Ne pas utiliser de transaction globale pour éviter le rollback en cascade
      // await client.query('BEGIN');

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
          d."NotesClear" as notes,
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
          cs."AccomplishedSales" as budget,
          cs."Status" as project_state,
          cs."CustomerId" as client_ref,
          cs."DescriptionClear" as notes,
          cs."sysModifiedDate" as modified_date
        FROM "ConstructionSite" cs
        WHERE cs."Caption" IS NOT NULL
        ORDER BY cs."sysModifiedDate" DESC NULLS LAST
      `);

      // Détecter et éviter les doublons entre Deal et ConstructionSite
      const dealIds = new Set(syncDeals.rows.map(d => d.project_id));
      const projectsIds = new Set(syncProjects.rows.map(p => p.project_id));
      const commonIds = [...dealIds].filter(id => projectsIds.has(id));
      
      if (commonIds.length > 0) {
        this.logger.warn(`⚠️  ${commonIds.length} IDs communs détectés entre Deal et ConstructionSite - priorité donnée aux Deal`);
        // Filtrer les ConstructionSite qui ont le même ID qu'un Deal
        const filteredProjects = syncProjects.rows.filter(p => !dealIds.has(p.project_id));
        this.logger.log(`Projets filtrés: ${syncProjects.rows.length} → ${filteredProjects.length}`);
        syncProjects.rows = filteredProjects;
      }

      // Combiner tous les projets (maintenant sans doublons)
      const allProjects = [...syncDeals.rows, ...syncProjects.rows];
      processed = allProjects.length;
      this.logger.log(`${processed} projets uniques (${syncDeals.rows.length} deals + ${syncProjects.rows.length} projets) à synchroniser`);

      // Traiter chaque projet individuellement (sans transaction globale)
      for (const syncProject of allProjects) {
        // Transaction individuelle pour chaque projet
        const individualClient = await pgClientApp.getClient();
        
        try {
          await individualClient.query('BEGIN');

          // Chercher le client correspondant avec une logique améliorée
          let clientAppId: number | null = null;

          if (syncProject.client_ref) {
            // 1. Recherche exacte par customer_id
            let clientSearch = await individualClient.query(`
              SELECT id FROM clients 
              WHERE customer_id = $1
            `, [syncProject.client_ref]);

            if (clientSearch.rows.length === 0) {
              // 2. Recherche par nom de société (approximative)
              clientSearch = await individualClient.query(`
                SELECT id FROM clients 
                WHERE company_name ILIKE $1
                ORDER BY 
                  CASE 
                    WHEN company_name = $2 THEN 1
                    WHEN company_name ILIKE $1 THEN 2
                    ELSE 3
                  END
                LIMIT 1
              `, [`%${syncProject.client_ref}%`, syncProject.client_ref]);
            }

            if (clientSearch.rows.length === 0) {
              // 3. Recherche dans la base sync pour récupérer les vraies infos client
              try {
                const realClientData = await pgClient.query(`
                  SELECT 
                    "Id" as id,
                    "Name" as name,
                    COALESCE("MainInvoicingContact_FirstName", "MainDeliveryContact_FirstName", '') as firstname,
                    COALESCE("MainInvoicingContact_Name", "MainDeliveryContact_Name", '') as lastname,
                    CASE
                      WHEN "MainInvoicingContact_Email" IS NOT NULL 
                           AND TRIM("MainInvoicingContact_Email") != '' 
                           AND "MainInvoicingContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
                      THEN TRIM(LOWER("MainInvoicingContact_Email"))
                      WHEN "MainDeliveryContact_Email" IS NOT NULL 
                           AND TRIM("MainDeliveryContact_Email") != '' 
                           AND "MainDeliveryContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
                      THEN TRIM(LOWER("MainDeliveryContact_Email"))
                      ELSE 'no-email-' || REPLACE(LOWER("Id"), ' ', '-') || '@technidalle.com'
                    END as email,
                    CASE 
                      WHEN regexp_replace(COALESCE("MainInvoicingContact_Phone", "MainDeliveryContact_Phone", ''), '[^0-9+]', '', 'g') ~ '^[0-9+]{10,15}$'
                      THEN regexp_replace(COALESCE("MainInvoicingContact_Phone", "MainDeliveryContact_Phone", ''), '[^0-9+]', '', 'g')
                      ELSE NULL
                    END as phone,
                    CASE 
                      WHEN regexp_replace(COALESCE("MainInvoicingContact_CellPhone", "MainDeliveryContact_CellPhone", ''), '[^0-9+]', '', 'g') ~ '^[0-9+]{10,15}$'
                      THEN regexp_replace(COALESCE("MainInvoicingContact_CellPhone", "MainDeliveryContact_CellPhone", ''), '[^0-9+]', '', 'g')
                      ELSE NULL
                    END as mobile,
                    "Siren" as siret,
                    "NotesClear" as notes
                                 FROM "Customer" 
               WHERE ("Id" = $1 OR "Name" ILIKE $2)
               LIMIT 1
                `, [syncProject.client_ref, `%${syncProject.client_ref}%`]);

                if (realClientData.rows.length > 0) {
                  const realClient = realClientData.rows[0];
                  this.logger.log(`✅ Client trouvé dans la base sync pour ${syncProject.client_ref}: ${realClient.name}`);
                  
                  // Créer le client avec les vraies informations
                  const realClientInsert = await individualClient.query(`
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
                  `, [
                    realClient.id,
                    realClient.name || '',
                    realClient.firstname || '',
                    realClient.lastname || '',
                    realClient.email,
                    realClient.phone || null,
                    realClient.mobile || null,
                    realClient.siret || null,
                    realClient.notes || null
                  ]);
                  
                  clientAppId = realClientInsert.rows[0].id;
                }
              } catch (syncError) {
                this.logger.warn(`Erreur lors de la recherche du client dans la base sync: ${syncError instanceof Error ? syncError.message : String(syncError)}`);
              }
            } else {
              clientAppId = clientSearch.rows[0].id;
            }
          }

          // Si toujours pas de client trouvé, créer un client par défaut (mais avec de meilleures informations)
          if (!clientAppId) {
            // Essayer d'extraire plus d'informations du nom du projet
            let companyName = syncProject.client_ref || `Projet ${syncProject.name}`;
            let customerIdFallback = `missing-${syncProject.source_type.toLowerCase()}-${syncProject.project_id}`;
            
            this.logger.warn(`⚠️  Aucun client trouvé pour ${syncProject.client_ref}, création d'un client de fallback: ${companyName}`);
            
            const defaultClientResult = await individualClient.query(`
              INSERT INTO clients (
                customer_id, company_name, firstname, lastname, email, 
                created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, NOW(), NOW()
              ) 
              ON CONFLICT (customer_id) DO UPDATE SET 
                company_name = EXCLUDED.company_name,
                updated_at = NOW()
              RETURNING id
            `, [
              customerIdFallback,
              companyName,
              '', // Pas de firstname générique
              '', // Pas de lastname générique
              `${customerIdFallback.replace(/[^a-zA-Z0-9]/g, '-')}@technidalle.com`
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

          // Traitement des dates pour éviter les contraintes
          let startDate = syncProject.start_date || syncProject.deal_date || null;
          let endDate = syncProject.end_date || null;

          // Vérifier la contrainte check_project_dates (end_date >= start_date)
          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (end < start) {
              this.logger.warn(`Date de fin antérieure à la date de début pour le projet ${reference}, date de fin ignorée`);
              endDate = null;
            }
          }

          // Insérer le projet
          const projectInsert = await individualClient.query(`
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
            startDate,
            endDate, // Utiliser la date de fin validée
            syncProject.budget || syncProject.predicted_sales || null,
            status
          ]);

          await individualClient.query('COMMIT');
          succeeded++;
          this.logger.debug(`${syncProject.source_type} ${syncProject.project_id} synchronisé → app_id: ${projectInsert.rows[0].id}`);

        } catch (error) {
          await individualClient.query('ROLLBACK');
          failed++;
          const errorMsg = `Erreur projet ${syncProject.source_type} ${syncProject.project_id}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.warn(errorMsg);
        } finally {
          individualClient.release();
        }
      }

      this.logger.log(`✅ Projets: ${succeeded}/${processed} synchronisés`);

    } catch (error) {
      const errorMsg = `Erreur lors de la synchronisation des projets: ${error instanceof Error ? error.message : String(error)}`;
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
      // Ne pas utiliser de transaction globale pour éviter le rollback en cascade
      // await client.query('BEGIN');

      // Récupérer les items depuis la base Sync
      const syncItems = await pgClient.query(`
        SELECT 
          i."Id" as item_id,
          i."Caption" as name,
          i."DesComClear" as description,
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

      // Traiter chaque matériau individuellement (sans transaction globale)
      for (const syncItem of syncItems.rows) {
        // Transaction individuelle pour chaque matériau
        const individualClient = await pgClientApp.getClient();
        
        try {
          await individualClient.query('BEGIN');

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

          // Traitement des prix pour éviter les contraintes
          let price = parseFloat(syncItem.sale_price) || parseFloat(syncItem.purchase_price) || 0;
          
          // Vérifier la contrainte de prix
          if (price < 0) {
            this.logger.warn(`Prix négatif forcé à 0 pour le matériau ${syncItem.item_id} (prix original: ${price})`);
            price = 0;
          }

          await individualClient.query(insertQuery, [
            syncItem.item_id,
            syncItem.name || '',
            syncItem.description || null,
            syncItem.unit_name || 'unité',
            price,
            Math.max(0, syncItem.stock_quantity || 0),
            0 // minimum_stock par défaut
          ]);

          await individualClient.query('COMMIT');
          succeeded++;
          this.logger.debug(`Matériau ${syncItem.item_id} synchronisé`);

        } catch (error) {
          await individualClient.query('ROLLBACK');
          failed++;
          const errorMsg = `Erreur matériau ${syncItem.item_id}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.warn(errorMsg);
        } finally {
          individualClient.release();
        }
      }

      this.logger.log(`✅ Matériaux: ${succeeded}/${processed} synchronisés`);

    } catch (error) {
      const errorMsg = `Erreur lors de la synchronisation des matériaux: ${error instanceof Error ? error.message : String(error)}`;
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
      // 1. Récupérer TOUS les documents depuis la base Sync
      const syncDocuments = await pgClient.query(`
        -- Documents de vente généraux
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
          sd."NotesClear" as notes,
          sd."sysModifiedDate" as modified_date,
          'SALE' as document_source
        FROM "SaleDocument" sd
        WHERE sd."DocumentNumber" IS NOT NULL
        
        UNION ALL
        
        -- Documents de vente Deal (affaires)
        SELECT 
          dsd."Id" as document_id,
          dsd."DocumentNumber" as reference,
          dsd."DocumentDate" as issue_date,
          dsd."DocumentType" as document_type,
          d."xx_Client" as customer_id,
          dsd."AmountVatExcluded" as amount_ht,
          NULL as vat_amount,
          dsd."NetAmountVatIncludedWithDiscount" as amount_ttc,
          dsd."DealId" as deal_id,
          dsd."DocumentState" as validation_state,
          NULL as notes,
          dsd."sysModifiedDate" as modified_date,
          'DEAL_SALE' as document_source
        FROM "DealSaleDocument" dsd
        JOIN "Deal" d ON dsd."DealId" = d."Id"
        WHERE dsd."DocumentNumber" IS NOT NULL
        
        UNION ALL
        
        -- Documents d'achat Deal (affaires)
        SELECT 
          dpd."Id" as document_id,
          dpd."DocumentNumber" as reference,
          dpd."DocumentDate" as issue_date,
          dpd."DocumentType" as document_type,
          d."xx_Client" as customer_id,
          dpd."AmountVatExcluded" as amount_ht,
          NULL as vat_amount,
          dpd."NetAmountVatIncludedWithDiscount" as amount_ttc,
          dpd."DealId" as deal_id,
          dpd."DocumentState" as validation_state,
          NULL as notes,
          dpd."sysModifiedDate" as modified_date,
          'DEAL_PURCHASE' as document_source
        FROM "DealPurchaseDocument" dpd
        JOIN "Deal" d ON dpd."DealId" = d."Id"
        WHERE dpd."DocumentNumber" IS NOT NULL
        
        UNION ALL
        
        -- Documents de projet/chantier
        SELECT 
          csr."Id" as document_id,
          csr."Reference" as reference,
          csr."DocumentDate" as issue_date,
          csr."DocumentType" as document_type,
          cs."CustomerId" as customer_id,
          csr."AmountVatExcluded" as amount_ht,
          csr."VatAmount" as vat_amount,
          csr."AmountVatIncluded" as amount_ttc,
          cs."Id" as deal_id,
          csr."ValidationState" as validation_state,
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

      // Traiter chaque document individuellement (SANS transaction globale)
      for (const syncDoc of syncDocuments.rows) {
        // Transaction individuelle pour chaque document
        const individualClient = await pgClientApp.getClient();
        
        try {
          await individualClient.query('BEGIN');

          // Chercher le projet correspondant selon la source
          let projectAppId: number | null = null;
          let searchReference = '';

          if (syncDoc.deal_id) {
            if (syncDoc.document_source === 'SALE') {
              searchReference = `DEAL-${syncDoc.deal_id}`;
            } else if (syncDoc.document_source === 'DEAL_SALE' || syncDoc.document_source === 'DEAL_PURCHASE') {
              searchReference = `DEAL-${syncDoc.deal_id}`;
            } else {
              searchReference = `PROJECT-${syncDoc.deal_id}`;
            }

            const projectSearch = await individualClient.query(
              'SELECT id FROM projects WHERE reference = $1',
              [searchReference]
            );
            
            if (projectSearch.rows.length > 0) {
              projectAppId = projectSearch.rows[0].id;
            }
          }

          // Si pas de projet trouvé, chercher par client
          if (!projectAppId && syncDoc.customer_id) {
            const clientProjectSearch = await individualClient.query(`
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
            await individualClient.query('ROLLBACK');
            failed++;
            errors.push(`Projet non trouvé pour le document ${syncDoc.reference} (source: ${syncDoc.document_source})`);
            continue;
          }

          // Déterminer le type de document selon le mapping EBP correct
          let docType = 'autre';
          switch (syncDoc.document_type) {
            case 1: docType = 'devis'; break;           // Devis EBP
            case 2: docType = 'bon_de_commande'; break; // Commande EBP
            case 3: docType = 'bon_de_livraison'; break; // Livraison EBP
            case 6: docType = 'facture'; break;         // Facture EBP
            case 7: docType = 'avoir'; break;           // Avoir EBP
            case 8: docType = 'bon_de_livraison'; break; // Autre type de livraison EBP
            case 10: docType = 'autre'; break;          // Autre document EBP
            default: 
              console.log(`Type de document EBP inconnu: ${syncDoc.document_type}`);
              docType = 'autre';
          }

          // Déterminer le statut
          let status = 'brouillon';
          switch (syncDoc.validation_state) {
            case 1: status = 'en_attente'; break;
            case 2: status = 'valide'; break;
            case 3: status = 'refuse'; break;
            default: status = 'brouillon';
          }

          // Traitement des montants pour éviter les contraintes
          let amount = parseFloat(syncDoc.amount_ht) || 0;
          
          // Pour les avoirs (documents de type 4), gérer les montants négatifs
          if (docType === 'avoir' && amount < 0) {
            // Pour les avoirs, convertir en valeur absolue
            amount = Math.abs(amount);
          } else if (amount < 0) {
            // Pour les autres types, forcer à 0 si négatif pour éviter l'erreur de contrainte
            amount = 0;
            this.logger.warn(`Montant négatif forcé à 0 pour le document ${syncDoc.reference} (montant original: ${syncDoc.amount_ht})`);
          }

          // Insérer le document principal
          const documentInsert = await individualClient.query(`
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
            amount, // Utiliser le montant traité
            20.00, // TVA par défaut
            syncDoc.issue_date || new Date(),
            syncDoc.notes || null
          ]);

          const documentAppId = documentInsert.rows[0].id;

          // 2. Synchroniser les lignes de documents avec gestion d'erreur tolérante
          let linesSuccess = true;
          try {
            await this.syncDocumentLines(syncDoc, documentAppId, individualClient);
          } catch (linesError) {
            linesSuccess = false;
            this.logger.warn(`Erreur lignes pour ${syncDoc.reference}: ${linesError instanceof Error ? linesError.message : String(linesError)}`);
            // Continuer même si les lignes échouent - le document principal est valide
          }

          await individualClient.query('COMMIT');
          succeeded++;
          
          if (linesSuccess) {
            this.logger.debug(`Document ${syncDoc.reference} synchronisé complètement → document_id: ${documentAppId} (montant: ${amount})`);
          } else {
            this.logger.warn(`Document ${syncDoc.reference} synchronisé partiellement → document_id: ${documentAppId} (lignes échouées)`);
          }

        } catch (error) {
          await individualClient.query('ROLLBACK');
          failed++;
          const errorMsg = `Erreur document ${syncDoc.reference}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.warn(errorMsg);
        } finally {
          individualClient.release();
        }
      }

      this.logger.log(`✅ Documents: ${succeeded}/${processed} synchronisés`);

    } catch (error) {
      const errorMsg = `Erreur lors de la synchronisation des documents: ${error instanceof Error ? error.message : String(error)}`;
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
   * Synchronise les lignes d'un document avec les matériaux - Version optimisée
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
            sdl."DescriptionClear" as description,
            sdl."Quantity" as quantity,
            sdl."NetPriceVatExcluded" as unit_price,
            sdl."UnitDiscountRate" as discount_percent,
            sdl."NetAmountVatExcluded" as total_ht,
            sdl."LineOrder" as line_order,
            i."Caption" as item_name,
            i."UnitId" as unit_ref,
            u."Caption" as unit_name
          FROM "SaleDocumentLine" sdl
          LEFT JOIN "Item" i ON sdl."ItemId" = i."Id"
          LEFT JOIN "Unit" u ON i."UnitId" = u."Id"
          WHERE sdl."DocumentId" = $1
          ORDER BY sdl."LineOrder" NULLS LAST, sdl."Id"
        `, [syncDoc.document_id]);
        
        documentLines = saleDocumentLines.rows;
      } else if (syncDoc.document_source === 'DEAL_SALE') {
        const dealSaleDocumentLines = await pgClient.query(`
          SELECT 
            dsdl."Id" as line_id,
            dsdl."ItemId" as item_id,
            dsdl."DescriptionClear" as description,
            dsdl."Quantity" as quantity,
            dsdl."PurchasePrice" as unit_price,
            0 as discount_percent,
            dsdl."NetAmountVatExcludedWithDiscount" as total_ht,
            dsdl."LineOrder" as line_order,
            i."Caption" as item_name,
            i."UnitId" as unit_ref,
            u."Caption" as unit_name
          FROM "DealSaleDocumentLine" dsdl
          LEFT JOIN "Item" i ON dsdl."ItemId" = i."Id"
          LEFT JOIN "Unit" u ON i."UnitId" = u."Id"
          WHERE dsdl."DocumentId" = $1
          ORDER BY dsdl."LineOrder" NULLS LAST, dsdl."Id"
        `, [syncDoc.document_id]);
        
        documentLines = dealSaleDocumentLines.rows;
      } else if (syncDoc.document_source === 'DEAL_PURCHASE') {
        const dealPurchaseDocumentLines = await pgClient.query(`
          SELECT 
            dpdl."Id" as line_id,
            dpdl."ItemId" as item_id,
            dpdl."DescriptionClear" as description,
            dpdl."Quantity" as quantity,
            dpdl."PurchasePrice" as unit_price,
            0 as discount_percent,
            dpdl."NetAmountVatExcludedWithDiscount" as total_ht,
            dpdl."LineOrder" as line_order,
            i."Caption" as item_name,
            i."UnitId" as unit_ref,
            u."Caption" as unit_name
          FROM "DealPurchaseDocumentLine" dpdl
          LEFT JOIN "Item" i ON dpdl."ItemId" = i."Id"
          LEFT JOIN "Unit" u ON i."UnitId" = u."Id"
          WHERE dpdl."DocumentId" = $1
          ORDER BY dpdl."LineOrder" NULLS LAST, dpdl."Id"
        `, [syncDoc.document_id]);
        
        documentLines = dealPurchaseDocumentLines.rows;
      } else {
        const projectDocumentLines = await pgClient.query(`
          SELECT 
            csrl."Id" as line_id,
            csrl."ItemId" as item_id,
            csrl."DescriptionClear" as description,
            csrl."Quantity" as quantity,
            csrl."CostPrice" as unit_price,
            COALESCE(csrl."Discounts0_UnitDiscountRate", 0) as discount_percent,
            csrl."NetAmountVatExcluded" as total_ht,
            csrl."LineOrder" as line_order,
            i."Caption" as item_name,
            i."UnitId" as unit_ref,
            u."Caption" as unit_name
          FROM "ConstructionSiteReferenceDocumentLine" csrl
          LEFT JOIN "Item" i ON csrl."ItemId" = i."Id"
          LEFT JOIN "Unit" u ON i."UnitId" = u."Id"
          WHERE csrl."DocumentId" = $1
          ORDER BY csrl."LineOrder" NULLS LAST, csrl."Id"
        `, [syncDoc.document_id]);
        
        documentLines = projectDocumentLines.rows;
      }

      // Nettoyer d'abord les lignes existantes pour éviter les conflits
      await client.query('DELETE FROM document_lines WHERE document_id = $1', [documentAppId]);

      // Préparer le cache des matériaux pour éviter les requêtes répétées
      const materialCache = new Map<string, number>();
      const uniqueItemIds = [...new Set(documentLines.map(line => line.item_id).filter(Boolean))];
      
      if (uniqueItemIds.length > 0) {
        const materialsResult = await client.query(
          'SELECT id, reference FROM materials WHERE reference = ANY($1)',
          [uniqueItemIds]
        );
        
        materialsResult.rows.forEach(row => {
          materialCache.set(row.reference, row.id);
        });
      }

      let insertedLines = 0;
      let skippedLines = 0;

      // Insérer chaque ligne de document avec validation robuste
      for (let index = 0; index < documentLines.length; index++) {
        const line = documentLines[index];
        
        try {
          // Récupérer le matériau depuis le cache
          const materialId = line.item_id ? materialCache.get(line.item_id) || null : null;

          // Validation et nettoyage des données
          const unitPrice = Math.max(0, parseFloat(line.unit_price) || 0);
          const quantity = Math.max(0.01, parseFloat(line.quantity) || 1); // Minimum 0.01
          const discountPercent = Math.max(0, Math.min(100, parseFloat(line.discount_percent) || 0));
          const sortOrder = parseInt(line.line_order) || (index + 1);

          // Description avec fallback
          const description = (line.description || line.item_name || 'Article non spécifié').trim();
          if (!description || description.length === 0) {
            this.logger.warn(`Description vide pour ligne ${line.line_id}, utilisation fallback`);
          }

          // Unité avec fallback
          const unit = (line.unit_name || 'unité').trim() || 'unité';

          // Insérer la ligne avec gestion d'erreur individuelle
          const insertResult = await client.query(`
            INSERT INTO document_lines (
              document_id, material_id, description, quantity, unit, 
              unit_price, discount_percent, tax_rate, sort_order, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            RETURNING id
          `, [
            documentAppId,
            materialId,
            description,
            quantity,
            unit,
            unitPrice,
            discountPercent,
            20.00, // TVA par défaut
            sortOrder
          ]);

          if (insertResult.rows.length > 0) {
            insertedLines++;
            if (materialId) {
              this.logger.debug(`Ligne ${line.line_id} → app_line_id: ${insertResult.rows[0].id} (matériau: ${materialId})`);
            }
          }

        } catch (lineError) {
          skippedLines++;
          const errorMsg = lineError instanceof Error ? lineError.message : String(lineError);
          this.logger.warn(`Ligne ${line.line_id} ignorée: ${errorMsg}`);
          
          // Ne pas faire échouer tout le document pour une ligne défaillante
          // Continuer avec les autres lignes
        }
      }

      const successRate = documentLines.length > 0 ? Math.round((insertedLines / documentLines.length) * 100) : 100;
      this.logger.debug(`Document ${syncDoc.reference}: ${insertedLines}/${documentLines.length} lignes (${successRate}%, ${skippedLines} ignorées)`);

      // Considérer comme succès si au moins 70% des lignes sont synchronisées
      if (successRate < 70 && documentLines.length > 0) {
        this.logger.warn(`Taux de réussite faible pour ${syncDoc.reference}: ${successRate}%`);
      }

    } catch (error) {
      this.logger.error(`Erreur critique lors de la synchronisation des lignes du document ${syncDoc.reference}`, error);
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

  /**
   * Nettoie les emails dupliqués et invalides dans la base de données App
   */
  async cleanupEmailDuplicates(): Promise<{
    success: boolean;
    duplicates_fixed: number;
    invalid_emails_fixed: number;
    invalid_phones_fixed: number;
    normalized_count: number;
    message: string;
  }> {
    const client = await pgClientApp.getClient();
    
    try {
      await client.query('BEGIN');

      this.logger.log('🧹 Début du nettoyage des données clients...');

      // 1. Corriger les emails dupliqués
      const duplicatesResult = await client.query(`
        WITH duplicated_emails AS (
          SELECT 
            email,
            COUNT(*) as email_count,
            MIN(id) as keep_id
          FROM clients 
          WHERE email NOT LIKE 'no-email-%@technidalle.com'
          GROUP BY email 
          HAVING COUNT(*) > 1
        ),
        clients_to_update AS (
          SELECT 
            c.id,
            c.email,
            c.customer_id,
            de.keep_id,
            CASE 
              WHEN POSITION('@' IN c.email) > 0 THEN
                SUBSTRING(c.email FROM 1 FOR POSITION('@' IN c.email) - 1) || 
                '-' || c.customer_id || 
                SUBSTRING(c.email FROM POSITION('@' IN c.email))
              ELSE
                'no-email-' || c.customer_id || '@technidalle.com'
            END as new_email
          FROM clients c
          INNER JOIN duplicated_emails de ON c.email = de.email
          WHERE c.id != de.keep_id
        )
        UPDATE clients 
        SET 
          email = ctu.new_email,
          updated_at = NOW()
        FROM clients_to_update ctu
        WHERE clients.id = ctu.id
      `);

      // 2. Corriger les emails invalides
      const invalidEmailsResult = await client.query(`
        UPDATE clients 
        SET 
          email = 'no-email-' || customer_id || '@technidalle.com',
          updated_at = NOW()
        WHERE email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
      `);

      // 3. Corriger les numéros de téléphone invalides
      const invalidPhonesResult = await client.query(`
        UPDATE clients 
        SET 
          phone = CASE 
            WHEN phone IS NOT NULL AND phone !~ '^[0-9+\\s]{10,15}$' THEN NULL
            ELSE phone
          END,
          mobile = CASE 
            WHEN mobile IS NOT NULL AND mobile !~ '^[0-9+\\s]{10,15}$' THEN NULL
            ELSE mobile
          END,
          updated_at = NOW()
        WHERE 
          (phone IS NOT NULL AND phone !~ '^[0-9+\\s]{10,15}$') OR
          (mobile IS NOT NULL AND mobile !~ '^[0-9+\\s]{10,15}$')
      `);

      // 4. Normaliser tous les emails
      const normalizeResult = await client.query(`
        UPDATE clients 
        SET 
          email = TRIM(LOWER(email)),
          updated_at = NOW()
        WHERE email != TRIM(LOWER(email))
      `);

      // 5. Compter les résultats
      const countResult = await client.query('SELECT COUNT(*) as total FROM clients');

      await client.query('COMMIT');

      const result = {
        success: true,
        duplicates_fixed: duplicatesResult.rowCount || 0,
        invalid_emails_fixed: invalidEmailsResult.rowCount || 0,
        invalid_phones_fixed: invalidPhonesResult.rowCount || 0,
        normalized_count: normalizeResult.rowCount || 0,
        message: `Nettoyage terminé: ${duplicatesResult.rowCount || 0} doublons, ${invalidEmailsResult.rowCount || 0} emails invalides, ${invalidPhonesResult.rowCount || 0} téléphones invalides corrigés`
      };

      this.logger.log(`✅ ${result.message}`);
      return result;

    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('❌ Erreur lors du nettoyage des emails', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validation complète et nettoyage des données avant synchronisation
   */
  async validateAndCleanupData(): Promise<{
    success: boolean;
    cleanup_performed: boolean;
    issues_found: string[];
    cleanup_results?: any;
  }> {
    const client = await pgClientApp.getClient();
    const issues: string[] = [];
    
    try {
      // Vérifier les emails dupliqués
      const duplicatesCheck = await client.query(`
        SELECT COUNT(*) as count FROM (
          SELECT email, COUNT(*) 
          FROM clients 
          GROUP BY email 
          HAVING COUNT(*) > 1
        ) subq
      `);

      if (parseInt(duplicatesCheck.rows[0].count) > 0) {
        issues.push(`${duplicatesCheck.rows[0].count} emails dupliqués détectés`);
      }

      // Vérifier les emails invalides
      const invalidEmailsCheck = await client.query(`
        SELECT COUNT(*) as count 
        FROM clients 
        WHERE email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
      `);

      if (parseInt(invalidEmailsCheck.rows[0].count) > 0) {
        issues.push(`${invalidEmailsCheck.rows[0].count} emails invalides détectés`);
      }

      // Vérifier les téléphones invalides
      const invalidPhonesCheck = await client.query(`
        SELECT COUNT(*) as count 
        FROM clients 
        WHERE 
          (phone IS NOT NULL AND phone !~ '^[0-9+\\s]{10,15}$') OR
          (mobile IS NOT NULL AND mobile !~ '^[0-9+\\s]{10,15}$')
      `);

      if (parseInt(invalidPhonesCheck.rows[0].count) > 0) {
        issues.push(`${invalidPhonesCheck.rows[0].count} numéros de téléphone invalides détectés`);
      }

      // Si des problèmes sont détectés, effectuer le nettoyage
      if (issues.length > 0) {
        this.logger.warn(`⚠️ Problèmes détectés: ${issues.join(', ')}`);
        const cleanupResults = await this.cleanupEmailDuplicates();
        
        return {
          success: true,
          cleanup_performed: true,
          issues_found: issues,
          cleanup_results: cleanupResults
        };
      }

      return {
        success: true,
        cleanup_performed: false,
        issues_found: [],
      };

    } catch (error) {
      this.logger.error('❌ Erreur lors de la validation des données', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Synchronisation complète optimisée avec ordre intelligent et gestion d'erreurs améliorée
   * TOUT-EN-UN : Nettoyage, validation, création, mise à jour automatique
   */
  async syncCompleteOptimized(): Promise<SyncResult> {
    const startTime = Date.now();
    let totalProcessed = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;
    const errors: string[] = [];
    const stepResults: { step: string; processed: number; succeeded: number; failed: number; duration: number }[] = [];

    try {
      this.logger.log('🚀 Démarrage de la synchronisation PostgreSQL Sync → App (optimisée & complète)');

      // 0. NETTOYAGE PRÉALABLE : Nettoyer les clients factices et emails dupliqués
      this.logger.log('🧹 Étape 0: Nettoyage préalable des données');
      try {
        const cleanupResult = await this.cleanupFakeClients();
        const emailCleanupResult = await this.cleanupEmailDuplicates();
        this.logger.log(`📊 Nettoyage: ${cleanupResult.clients_corrected + cleanupResult.clients_merged} clients factices corrigés, ${emailCleanupResult.duplicates_fixed} emails dupliqués résolus`);
      } catch (cleanupError) {
        this.logger.warn('⚠️ Erreur lors du nettoyage préalable (non bloquant)', cleanupError);
        errors.push(`Nettoyage préalable: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
      }

      // 1. Synchroniser les clients en premier (priorité absolue)
      this.logger.log('📋 Étape 1: Synchronisation des clients (priorité)');
      const clientsResult = await this.syncClients();
      totalProcessed += clientsResult.processed;
      totalSucceeded += clientsResult.succeeded;
      totalFailed += clientsResult.failed;
      errors.push(...clientsResult.errors);
      stepResults.push({
        step: 'clients',
        processed: clientsResult.processed,
        succeeded: clientsResult.succeeded,
        failed: clientsResult.failed,
        duration: clientsResult.duration
      });

      // 2. Synchroniser les matériaux (indépendant des autres)
      this.logger.log('📦 Étape 2: Synchronisation des matériaux');
      const materialsResult = await this.syncMaterials();
      totalProcessed += materialsResult.processed;
      totalSucceeded += materialsResult.succeeded;
      totalFailed += materialsResult.failed;
      errors.push(...materialsResult.errors);
      stepResults.push({
        step: 'matériaux',
        processed: materialsResult.processed,
        succeeded: materialsResult.succeeded,
        failed: materialsResult.failed,
        duration: materialsResult.duration
      });

      // 3. Synchroniser les adresses (dépend des clients, mais peut créer automatiquement)
      this.logger.log('📍 Étape 3: Synchronisation des adresses');
      const addressesResult = await this.syncAddresses();
      totalProcessed += addressesResult.processed;
      totalSucceeded += addressesResult.succeeded;
      totalFailed += addressesResult.failed;
      errors.push(...addressesResult.errors);
      stepResults.push({
        step: 'adresses',
        processed: addressesResult.processed,
        succeeded: addressesResult.succeeded,
        failed: addressesResult.failed,
        duration: addressesResult.duration
      });

      // 4. Synchroniser les projets (dépend des clients)
      this.logger.log('🏗️ Étape 4: Synchronisation des projets');
      const projectsResult = await this.syncProjects();
      totalProcessed += projectsResult.processed;
      totalSucceeded += projectsResult.succeeded;
      totalFailed += projectsResult.failed;
      errors.push(...projectsResult.errors);
      stepResults.push({
        step: 'projets',
        processed: projectsResult.processed,
        succeeded: projectsResult.succeeded,
        failed: projectsResult.failed,
        duration: projectsResult.duration
      });

      // 5. Synchroniser les documents (dépend des projets)
      this.logger.log('📄 Étape 5: Synchronisation des documents');
      const documentsResult = await this.syncDocuments();
      totalProcessed += documentsResult.processed;
      totalSucceeded += documentsResult.succeeded;
      totalFailed += documentsResult.failed;
      errors.push(...documentsResult.errors);
      stepResults.push({
        step: 'documents',
        processed: documentsResult.processed,
        succeeded: documentsResult.succeeded,
        failed: documentsResult.failed,
        duration: documentsResult.duration
      });

      // 6. NETTOYAGE POST-SYNCHRONISATION : Réparer les documents sans lignes
      this.logger.log('🔧 Étape 6: Réparation des documents sans lignes');
      try {
        const repairResult = await this.repairDocumentsWithoutLines();
        this.logger.log(`🔧 Réparation: ${repairResult.documents_repaired}/${repairResult.documents_analyzed} documents réparés`);
        
        // Ne pas compter dans les totaux car c'est une correction, pas une synchronisation
        if (repairResult.errors.length > 0) {
          errors.push(...repairResult.errors.slice(0, 5)); // Limiter les erreurs de réparation
        }
      } catch (repairError) {
        this.logger.warn('⚠️ Erreur lors de la réparation des documents (non bloquant)', repairError);
        errors.push(`Réparation documents: ${repairError instanceof Error ? repairError.message : String(repairError)}`);
      }

      const totalDuration = Date.now() - startTime;
      const successRate = totalProcessed > 0 ? Math.round((totalSucceeded / totalProcessed) * 100) : 0;

      // Afficher le résumé détaillé
      this.logger.log('📊 Résumé de la synchronisation optimisée COMPLÈTE:');
      stepResults.forEach(step => {
        const stepSuccessRate = step.processed > 0 ? Math.round((step.succeeded / step.processed) * 100) : 0;
        this.logger.log(`   ${step.step}: ${step.succeeded}/${step.processed} (${stepSuccessRate}%) en ${step.duration}ms`);
      });

      this.logger.log(`✅ Synchronisation COMPLÈTE terminée: ${totalSucceeded}/${totalProcessed} (${successRate}%) en ${totalDuration}ms`);
      this.logger.log(`🎯 Endpoint TOUT-EN-UN : Nettoyage + Validation + Synchronisation + Réparation effectués`);

      return {
        success: successRate >= 80, // Considérer comme succès si > 80%
        processed: totalProcessed,
        succeeded: totalSucceeded,
        failed: totalFailed,
        errors: errors.slice(0, 50), // Limiter les erreurs affichées
        duration: totalDuration,
      };

    } catch (error) {
      const errorMsg = `Erreur critique lors de la synchronisation: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMsg);
      errors.push(errorMsg);

      return {
        success: false,
        processed: totalProcessed,
        succeeded: totalSucceeded,
        failed: totalProcessed,
        errors,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Répare les documents synchronisés sans lignes
   */
  async repairDocumentsWithoutLines(): Promise<{
    success: boolean;
    documents_analyzed: number;
    documents_repaired: number;
    lines_added: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    let documentsAnalyzed = 0;
    let documentsRepaired = 0;
    let linesAdded = 0;
    const errors: string[] = [];

    const client = await pgClientApp.getClient();

    try {
      this.logger.log('🔧 Analyse et réparation des documents sans lignes...');

      // Trouver les documents sans lignes
      const documentsWithoutLines = await client.query(`
        SELECT 
          d.id,
          d.reference,
          d.project_id,
          d.type,
          d.amount
        FROM documents d
        LEFT JOIN document_lines dl ON d.id = dl.document_id
        WHERE dl.id IS NULL
        ORDER BY d.created_at DESC
      `);

      documentsAnalyzed = documentsWithoutLines.rows.length;
      this.logger.log(`📊 ${documentsAnalyzed} documents sans lignes détectés`);

      for (const document of documentsWithoutLines.rows) {
        const individualClient = await pgClientApp.getClient();
        
        try {
          await individualClient.query('BEGIN');

          // Essayer de retrouver le document source
          const sourceDocQuery = await pgClient.query(`
            SELECT 
              'SALE' as source_type,
              sd."Id" as document_id
            FROM "SaleDocument" sd
            WHERE sd."DocumentNumber" = $1
            
            UNION ALL
            
            SELECT 
              'DEAL_SALE' as source_type,
              dsd."Id" as document_id
            FROM "DealSaleDocument" dsd
            WHERE dsd."DocumentNumber" = $1
            
            UNION ALL
            
            SELECT 
              'DEAL_PURCHASE' as source_type,
              dpd."Id" as document_id
            FROM "DealPurchaseDocument" dpd
            WHERE dpd."DocumentNumber" = $1
            
            UNION ALL
            
            SELECT 
              'PROJECT' as source_type,
              csr."Id" as document_id
            FROM "ConstructionSiteReferenceDocument" csr
            WHERE csr."Reference" = $1
            
            LIMIT 1
          `, [document.reference]);

          if (sourceDocQuery.rows.length > 0) {
            const sourceDoc = sourceDocQuery.rows[0];
            
            // Créer un objet syncDoc pour réutiliser syncDocumentLines
            const syncDoc = {
              document_source: sourceDoc.source_type,
              document_id: sourceDoc.document_id,
              reference: document.reference
            };

            // Synchroniser les lignes
            await this.syncDocumentLines(syncDoc, document.id, individualClient);

            // Compter les lignes ajoutées
            const linesCountResult = await individualClient.query(
              'SELECT COUNT(*) as count FROM document_lines WHERE document_id = $1',
              [document.id]
            );

            const addedLines = parseInt(linesCountResult.rows[0].count) || 0;
            
            if (addedLines > 0) {
              documentsRepaired++;
              linesAdded += addedLines;
              this.logger.debug(`Document ${document.reference} réparé: ${addedLines} lignes ajoutées`);
            }
          }

          await individualClient.query('COMMIT');

        } catch (error) {
          await individualClient.query('ROLLBACK');
          const errorMsg = `Erreur réparation document ${document.reference}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.warn(errorMsg);
        } finally {
          individualClient.release();
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Réparation terminée: ${documentsRepaired}/${documentsAnalyzed} documents réparés, ${linesAdded} lignes ajoutées en ${duration}ms`);

      return {
        success: errors.length === 0,
        documents_analyzed: documentsAnalyzed,
        documents_repaired: documentsRepaired,
        lines_added: linesAdded,
        errors: errors.slice(0, 10) // Limiter les erreurs affichées
      };

    } catch (error) {
      const errorMsg = `Erreur lors de la réparation des documents: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      this.logger.error(errorMsg);

      return {
        success: false,
        documents_analyzed: documentsAnalyzed,
        documents_repaired: documentsRepaired,
        lines_added: linesAdded,
        errors
      };

    } finally {
      client.release();
    }
  }

  /**
   * Analyse détaillée des échecs de synchronisation des documents
   */
  async analyzeDocumentSyncFailures(): Promise<{
    total_documents_in_sync: number;
    total_documents_in_app: number;
    sync_rate: number;
    documents_without_lines: number;
    documents_with_zero_amount: number;
    missing_projects: number;
    analysis: any[];
  }> {
    try {
      // Compter les documents dans la base Sync
      const syncDocCount = await pgClient.query(`
        SELECT COUNT(*) as count FROM (
          SELECT "DocumentNumber" FROM "SaleDocument" WHERE "DocumentNumber" IS NOT NULL
          UNION
          SELECT "DocumentNumber" FROM "DealSaleDocument" WHERE "DocumentNumber" IS NOT NULL
          UNION
          SELECT "DocumentNumber" FROM "DealPurchaseDocument" WHERE "DocumentNumber" IS NOT NULL
          UNION
          SELECT "Reference" FROM "ConstructionSiteReferenceDocument" WHERE "Reference" IS NOT NULL
        ) all_docs
      `);

      // Compter les documents dans l'app
      const appDocCount = await this.queryService.executeQuery('SELECT COUNT(*) as count FROM documents');

      // Documents sans lignes
      const docsWithoutLines = await this.queryService.executeQuery(`
        SELECT COUNT(*) as count
        FROM documents d
        LEFT JOIN document_lines dl ON d.id = dl.document_id
        WHERE dl.id IS NULL
      `);

      // Documents avec montant zéro
      const docsWithZeroAmount = await this.queryService.executeQuery(`
        SELECT COUNT(*) as count FROM documents WHERE amount = 0 OR amount IS NULL
      `);

      // Projets manquants
      const missingProjects = await this.queryService.executeQuery(`
        SELECT COUNT(*) as count FROM documents WHERE project_id IS NULL
      `);

      const totalSync = parseInt(syncDocCount.rows[0].count);
      const totalApp = parseInt(appDocCount.rows[0].count);
      const syncRate = totalSync > 0 ? Math.round((totalApp / totalSync) * 100) : 0;

      const analysis = [
        {
          metric: 'Documents sans lignes',
          count: parseInt(docsWithoutLines.rows[0].count),
          percentage: totalApp > 0 ? Math.round((parseInt(docsWithoutLines.rows[0].count) / totalApp) * 100) : 0
        },
        {
          metric: 'Documents avec montant zéro',
          count: parseInt(docsWithZeroAmount.rows[0].count),
          percentage: totalApp > 0 ? Math.round((parseInt(docsWithZeroAmount.rows[0].count) / totalApp) * 100) : 0
        },
        {
          metric: 'Documents sans projet',
          count: parseInt(missingProjects.rows[0].count),
          percentage: totalApp > 0 ? Math.round((parseInt(missingProjects.rows[0].count) / totalApp) * 100) : 0
        }
      ];

      return {
        total_documents_in_sync: totalSync,
        total_documents_in_app: totalApp,
        sync_rate: syncRate,
        documents_without_lines: parseInt(docsWithoutLines.rows[0].count),
        documents_with_zero_amount: parseInt(docsWithZeroAmount.rows[0].count),
        missing_projects: parseInt(missingProjects.rows[0].count),
        analysis
      };

    } catch (error) {
      this.logger.error('Erreur lors de l\'analyse des échecs de synchronisation', error);
      throw error;
    }
  }

  /**
   * Nettoie et corrige les clients factices créés avec des données génériques
   */
  async cleanupFakeClients(): Promise<{
    success: boolean;
    fake_clients_found: number;
    clients_corrected: number;
    clients_merged: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    let fakeClientsFound = 0;
    let clientsCorrected = 0;
    let clientsMerged = 0;
    const errors: string[] = [];

    const client = await pgClientApp.getClient();

    try {
      this.logger.log('🧹 Début du nettoyage des clients factices');

      // 1. Identifier les clients factices (créés automatiquement)
      const fakeClientsQuery = `
        SELECT id, customer_id, company_name, firstname, lastname, email
        FROM clients 
        WHERE (
          customer_id LIKE 'deal-%' 
          OR customer_id LIKE 'project-%' 
          OR customer_id LIKE 'missing-%'
          OR (firstname = 'Client' AND lastname = 'Inconnu')
          OR email LIKE 'deal-%@technidalle.com'
          OR email LIKE 'project-%@technidalle.com'
          OR email LIKE 'missing-%@technidalle.com'
        )
        ORDER BY id
      `;
      
      const fakeClients = await client.query(fakeClientsQuery);
      fakeClientsFound = fakeClients.rows.length;
      
      this.logger.log(`📊 ${fakeClientsFound} clients factices trouvés`);

      for (const fakeClient of fakeClients.rows) {
        try {
          // Extraire les informations du customer_id pour retrouver la source
          let sourceRef: string | null = null;
          let searchTerm: string | null = null;

          if (fakeClient.customer_id.startsWith('deal-') || fakeClient.customer_id.startsWith('project-')) {
            // Récupérer l'ID original depuis les tables Deal ou ConstructionSite
            const sourceId = fakeClient.customer_id.replace(/^(deal|project)-/, '');
            
            if (fakeClient.customer_id.startsWith('deal-')) {
              const dealQuery = await pgClient.query(
                'SELECT "xx_Client" as client_ref FROM "Deal" WHERE "Id" = $1',
                [sourceId]
              );
              if (dealQuery.rows.length > 0) {
                sourceRef = dealQuery.rows[0].client_ref;
              }
            } else {
              const projectQuery = await pgClient.query(
                'SELECT "CustomerId" as client_ref FROM "ConstructionSite" WHERE "Id" = $1',
                [sourceId]
              );
              if (projectQuery.rows.length > 0) {
                sourceRef = projectQuery.rows[0].client_ref;
              }
            }
          } else if (fakeClient.company_name && !fakeClient.company_name.startsWith('Client du projet')) {
            // Utiliser le nom de la société pour rechercher
            searchTerm = fakeClient.company_name;
            
            // Si le company_name ressemble à un ID client EBP, l'utiliser directement
            if (fakeClient.company_name.match(/^(CL|CE|FO|PR)[0-9A-Z]+$/i)) {
              sourceRef = fakeClient.company_name;
              this.logger.debug(`Company name ${fakeClient.company_name} détecté comme ID client EBP`);
            }
          }

          // Rechercher le vrai client dans la base sync avec une approche élargie
          let realClient: any = null;
          
          // 1. Recherche directe par ID
          if (sourceRef) {
            const realClientQuery = await pgClient.query(`
              SELECT 
                "Id" as id,
                "Name" as name,
                COALESCE("MainInvoicingContact_FirstName", "MainDeliveryContact_FirstName", '') as firstname,
                COALESCE("MainInvoicingContact_Name", "MainDeliveryContact_Name", '') as lastname,
                CASE
                  WHEN "MainInvoicingContact_Email" IS NOT NULL 
                       AND TRIM("MainInvoicingContact_Email") != '' 
                       AND "MainInvoicingContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
                  THEN TRIM(LOWER("MainInvoicingContact_Email"))
                  WHEN "MainDeliveryContact_Email" IS NOT NULL 
                       AND TRIM("MainDeliveryContact_Email") != '' 
                       AND "MainDeliveryContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
                  THEN TRIM(LOWER("MainDeliveryContact_Email"))
                  ELSE 'no-email-' || REPLACE(LOWER("Id"), ' ', '-') || '@technidalle.com'
                END as email,
                CASE 
                  WHEN regexp_replace(COALESCE("MainInvoicingContact_Phone", "MainDeliveryContact_Phone", ''), '[^0-9+]', '', 'g') ~ '^[0-9+]{10,15}$'
                  THEN regexp_replace(COALESCE("MainInvoicingContact_Phone", "MainDeliveryContact_Phone", ''), '[^0-9+]', '', 'g')
                  ELSE NULL
                END as phone,
                CASE 
                  WHEN regexp_replace(COALESCE("MainInvoicingContact_CellPhone", "MainDeliveryContact_CellPhone", ''), '[^0-9+]', '', 'g') ~ '^[0-9+]{10,15}$'
                  THEN regexp_replace(COALESCE("MainInvoicingContact_CellPhone", "MainDeliveryContact_CellPhone", ''), '[^0-9+]', '', 'g')
                  ELSE NULL
                END as mobile,
                "Siren" as siret,
                "NotesClear" as notes
              FROM "Customer" 
              WHERE "Id" = $1
                AND ("ActiveState" = 1 OR "ActiveState" IS NULL)
              LIMIT 1
            `, [sourceRef]);

            if (realClientQuery.rows.length > 0) {
              realClient = realClientQuery.rows[0];
              this.logger.debug(`✅ Client trouvé par ID direct: ${sourceRef} → ${realClient.name}`);
            }
          }

          // 2. Si pas trouvé, recherche par nom partiel (cas des noms tronqués)
          if (!realClient && searchTerm) {
            const partialNameQuery = await pgClient.query(`
              SELECT 
                "Id" as id,
                "Name" as name,
                COALESCE("MainInvoicingContact_FirstName", "MainDeliveryContact_FirstName", '') as firstname,
                COALESCE("MainInvoicingContact_Name", "MainDeliveryContact_Name", '') as lastname,
                CASE
                  WHEN "MainInvoicingContact_Email" IS NOT NULL 
                       AND TRIM("MainInvoicingContact_Email") != '' 
                       AND "MainInvoicingContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
                  THEN TRIM(LOWER("MainInvoicingContact_Email"))
                  WHEN "MainDeliveryContact_Email" IS NOT NULL 
                       AND TRIM("MainDeliveryContact_Email") != '' 
                       AND "MainDeliveryContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
                  THEN TRIM(LOWER("MainDeliveryContact_Email"))
                  ELSE 'no-email-' || REPLACE(LOWER("Id"), ' ', '-') || '@inconnu.com'
                END as email,
                CASE 
                  WHEN regexp_replace(COALESCE("MainInvoicingContact_Phone", "MainDeliveryContact_Phone", ''), '[^0-9+]', '', 'g') ~ '^[0-9+]{10,15}$'
                  THEN regexp_replace(COALESCE("MainInvoicingContact_Phone", "MainDeliveryContact_Phone", ''), '[^0-9+]', '', 'g')
                  ELSE NULL
                END as phone,
                CASE 
                  WHEN regexp_replace(COALESCE("MainInvoicingContact_CellPhone", "MainDeliveryContact_CellPhone", ''), '[^0-9+]', '', 'g') ~ '^[0-9+]{10,15}$'
                  THEN regexp_replace(COALESCE("MainInvoicingContact_CellPhone", "MainDeliveryContact_CellPhone", ''), '[^0-9+]', '', 'g')
                  ELSE NULL
                END as mobile,
                "Siren" as siret,
                "NotesClear" as notes,
                -- Score de similarité pour trier les résultats
                CASE 
                  WHEN UPPER("Name") = UPPER($1) THEN 1
                  WHEN "Name" ILIKE $2 THEN 2
                  WHEN "Name" ILIKE $3 THEN 3
                  ELSE 4
                END as similarity_score
              FROM "Customer" 
              WHERE (
                "Name" ILIKE $2
                OR "Name" ILIKE $3
                OR UPPER(REPLACE("Name", ' ', '')) LIKE UPPER(REPLACE($1, ' ', '')) || '%'
                OR UPPER(REPLACE($1, ' ', '')) LIKE UPPER(REPLACE("Name", ' ', '')) || '%'
              )
              AND ("ActiveState" = 1 OR "ActiveState" IS NULL)
              ORDER BY similarity_score, LENGTH("Name")
              LIMIT 1
            `, [searchTerm, `%${searchTerm}%`, `${searchTerm}%`]);

            if (partialNameQuery.rows.length > 0) {
              realClient = partialNameQuery.rows[0];
              this.logger.debug(`✅ Client trouvé par nom partiel: ${searchTerm} → ${realClient.name}`);
            }
          }

          // 3. Si toujours pas trouvé, essayer une recherche par mots-clés
          if (!realClient && searchTerm && searchTerm.length > 3) {
            const keywordQuery = await pgClient.query(`
              SELECT 
                "Id" as id,
                "Name" as name,
                COALESCE("MainInvoicingContact_FirstName", "MainDeliveryContact_FirstName", '') as firstname,
                COALESCE("MainInvoicingContact_Name", "MainDeliveryContact_Name", '') as lastname,
                CASE
                  WHEN "MainInvoicingContact_Email" IS NOT NULL 
                       AND TRIM("MainInvoicingContact_Email") != '' 
                       AND "MainInvoicingContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
                  THEN TRIM(LOWER("MainInvoicingContact_Email"))
                  WHEN "MainDeliveryContact_Email" IS NOT NULL 
                       AND TRIM("MainDeliveryContact_Email") != '' 
                       AND "MainDeliveryContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
                  THEN TRIM(LOWER("MainDeliveryContact_Email"))
                  ELSE 'no-email-' || REPLACE(LOWER("Id"), ' ', '-') || '@inconnu.com'
                END as email,
                CASE 
                  WHEN regexp_replace(COALESCE("MainInvoicingContact_Phone", "MainDeliveryContact_Phone", ''), '[^0-9+]', '', 'g') ~ '^[0-9+]{10,15}$'
                  THEN regexp_replace(COALESCE("MainInvoicingContact_Phone", "MainDeliveryContact_Phone", ''), '[^0-9+]', '', 'g')
                  ELSE NULL
                END as phone,
                CASE 
                  WHEN regexp_replace(COALESCE("MainInvoicingContact_CellPhone", "MainDeliveryContact_CellPhone", ''), '[^0-9+]', '', 'g') ~ '^[0-9+]{10,15}$'
                  THEN regexp_replace(COALESCE("MainInvoicingContact_CellPhone", "MainDeliveryContact_CellPhone", ''), '[^0-9+]', '', 'g')
                  ELSE NULL
                END as mobile,
                "Siren" as siret,
                "NotesClear" as notes
              FROM "Customer" 
              WHERE to_tsvector('french', "Name") @@ plainto_tsquery('french', $1)
                AND ("ActiveState" = 1 OR "ActiveState" IS NULL)
              ORDER BY ts_rank(to_tsvector('french', "Name"), plainto_tsquery('french', $1)) DESC
              LIMIT 1
            `, [searchTerm]);

            if (keywordQuery.rows.length > 0) {
              realClient = keywordQuery.rows[0];
              this.logger.debug(`✅ Client trouvé par recherche textuelle: ${searchTerm} → ${realClient.name}`);
            }
          }

          if (realClient) {
            // Vérifier si un client avec le vrai customer_id existe déjà
            const existingRealClient = await client.query(
              'SELECT id FROM clients WHERE customer_id = $1 AND id != $2',
              [realClient.id, fakeClient.id]
            );

            if (existingRealClient.rows.length > 0) {
              // Le vrai client existe déjà, on doit merger
              const realClientId = existingRealClient.rows[0].id;
              
              await client.query('BEGIN');
              
              try {
                // Transférer les projets du faux client vers le vrai client
                await client.query(
                  'UPDATE projects SET client_id = $1 WHERE client_id = $2',
                  [realClientId, fakeClient.id]
                );
                
                // Transférer les adresses
                await client.query(`
                  UPDATE client_addresses 
                  SET client_id = $1 
                  WHERE client_id = $2 
                    AND NOT EXISTS (
                      SELECT 1 FROM client_addresses ca2 
                      WHERE ca2.client_id = $1 AND ca2.address_id = client_addresses.address_id
                    )
                `, [realClientId, fakeClient.id]);
                
                // Supprimer le faux client
                await client.query('DELETE FROM clients WHERE id = $1', [fakeClient.id]);
                
                await client.query('COMMIT');
                clientsMerged++;
                
                this.logger.log(`🔀 Client factice ${fakeClient.customer_id} fusionné avec le vrai client ${realClient.id}`);
              } catch (mergeError) {
                await client.query('ROLLBACK');
                throw mergeError;
              }
            } else {
              // Corriger le faux client avec les vraies données
              await client.query(`
                UPDATE clients 
                SET 
                  customer_id = $1,
                  company_name = $2,
                  firstname = $3,
                  lastname = $4,
                  email = $5,
                  phone = $6,
                  mobile = $7,
                  siret = $8,
                  notes = $9,
                  updated_at = NOW()
                WHERE id = $10
              `, [
                realClient.id,
                realClient.name || '',
                realClient.firstname || '',
                realClient.lastname || '',
                realClient.email,
                realClient.phone || null,
                realClient.mobile || null,
                realClient.siret || null,
                realClient.notes || null,
                fakeClient.id
              ]);
              
              clientsCorrected++;
              this.logger.log(`✅ Client factice ${fakeClient.customer_id} corrigé avec les données du client ${realClient.id}`);
            }
          } else {
            this.logger.warn(`⚠️  Aucun vrai client trouvé pour ${fakeClient.customer_id} (sourceRef: ${sourceRef}, searchTerm: ${searchTerm})`);
          }

        } catch (error) {
          const errorMsg = `Erreur lors de la correction du client ${fakeClient.customer_id}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Nettoyage terminé en ${duration}ms: ${clientsCorrected} corrigés, ${clientsMerged} fusionnés`);

    } catch (error) {
      const errorMsg = `Erreur fatale lors du nettoyage des clients factices: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      this.logger.error(errorMsg);
    } finally {
      client.release();
    }

    return {
      success: errors.length === 0,
      fake_clients_found: fakeClientsFound,
      clients_corrected: clientsCorrected,
      clients_merged: clientsMerged,
      errors
    };
  }

  /**
   * Test simple : vérifier si un client existe dans la base sync
   */
  async testClientInSync(clientId: string): Promise<any> {
    try {
      const result = await pgClient.query(`
        SELECT 
          "Id" as id,
          "Name" as name,
          COALESCE("MainInvoicingContact_FirstName", "MainDeliveryContact_FirstName", '') as firstname,
          COALESCE("MainInvoicingContact_Name", "MainDeliveryContact_Name", '') as lastname,
          CASE
            WHEN "MainInvoicingContact_Email" IS NOT NULL 
                 AND TRIM("MainInvoicingContact_Email") != '' 
                 AND "MainInvoicingContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
            THEN TRIM(LOWER("MainInvoicingContact_Email"))
            WHEN "MainDeliveryContact_Email" IS NOT NULL 
                 AND TRIM("MainDeliveryContact_Email") != '' 
                 AND "MainDeliveryContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
            THEN TRIM(LOWER("MainDeliveryContact_Email"))
            ELSE 'no-email-' || REPLACE(LOWER("Id"), ' ', '-') || '@technidalle.com'
          END as email,
          "ActiveState" as active_state,
          "Siren" as siret
        FROM "Customer" 
        WHERE "Id" = $1
        LIMIT 1
      `, [clientId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      this.logger.error(`Erreur lors du test client ${clientId}:`, error);
      return null;
    }
  }

  /**
   * Force la synchronisation de clients spécifiques depuis la base sync vers l'app
   */
  async forceSyncSpecificClients(clientIds: string[]): Promise<{
    success: boolean;
    clients_processed: number;
    clients_synchronized: number;
    clients_updated: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    let clientsProcessed = 0;
    let clientsSynchronized = 0;
    let clientsUpdated = 0;
    const errors: string[] = [];

    const client = await pgClientApp.getClient();

    try {
      this.logger.log(`🔄 Début de la synchronisation forcée de ${clientIds.length} clients spécifiques`);

      for (const clientId of clientIds) {
        try {
          clientsProcessed++;

          // 1. Récupérer le client depuis la base sync
          const syncClientQuery = await pgClient.query(`
            SELECT 
              "Id" as id,
              "Name" as name,
              COALESCE("MainInvoicingContact_FirstName", "MainDeliveryContact_FirstName", '') as firstname,
              COALESCE("MainInvoicingContact_Name", "MainDeliveryContact_Name", '') as lastname,
              CASE
                WHEN "MainInvoicingContact_Email" IS NOT NULL 
                     AND TRIM("MainInvoicingContact_Email") != '' 
                     AND "MainInvoicingContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
                THEN TRIM(LOWER("MainInvoicingContact_Email"))
                WHEN "MainDeliveryContact_Email" IS NOT NULL 
                     AND TRIM("MainDeliveryContact_Email") != '' 
                     AND "MainDeliveryContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' 
                THEN TRIM(LOWER("MainDeliveryContact_Email"))
                ELSE 'no-email-' || REPLACE(LOWER("Id"), ' ', '-') || '@technidalle.com'
              END as email,
              CASE 
                WHEN regexp_replace(COALESCE("MainInvoicingContact_Phone", "MainDeliveryContact_Phone", ''), '[^0-9+]', '', 'g') ~ '^[0-9+]{10,15}$'
                THEN regexp_replace(COALESCE("MainInvoicingContact_Phone", "MainDeliveryContact_Phone", ''), '[^0-9+]', '', 'g')
                ELSE NULL
              END as phone,
              CASE 
                WHEN regexp_replace(COALESCE("MainInvoicingContact_CellPhone", "MainDeliveryContact_CellPhone", ''), '[^0-9+]', '', 'g') ~ '^[0-9+]{10,15}$'
                THEN regexp_replace(COALESCE("MainInvoicingContact_CellPhone", "MainDeliveryContact_CellPhone", ''), '[^0-9+]', '', 'g')
                ELSE NULL
              END as mobile,
              "Siren" as siret,
              "NotesClear" as notes,
              "ActiveState" as active_state,
              "sysModifiedDate" as modified_date
            FROM "Customer" 
            WHERE "Id" = $1
            LIMIT 1
          `, [clientId]);

          if (syncClientQuery.rows.length === 0) {
            const errorMsg = `Client ${clientId} non trouvé dans la base sync`;
            errors.push(errorMsg);
            this.logger.warn(`⚠️  ${errorMsg}`);
            continue;
          }

          const syncClient = syncClientQuery.rows[0];

          // 2. Vérifier si le client existe déjà dans l'app
          const existingClientQuery = await client.query(
            'SELECT id, customer_id, email FROM clients WHERE customer_id = $1',
            [clientId]
          );

          if (existingClientQuery.rows.length > 0) {
            // Le client existe, le mettre à jour
            const updateQuery = `
              UPDATE clients 
              SET 
                company_name = $1,
                firstname = $2,
                lastname = $3,
                email = $4,
                phone = $5,
                mobile = $6,
                siret = $7,
                notes = $8,
                updated_at = NOW()
              WHERE customer_id = $9
              RETURNING id
            `;

            await client.query(updateQuery, [
              syncClient.name || '',
              syncClient.firstname || '',
              syncClient.lastname || '',
              syncClient.email,
              syncClient.phone || null,
              syncClient.mobile || null,
              syncClient.siret || null,
              syncClient.notes || null,
              clientId
            ]);

            clientsUpdated++;
            this.logger.log(`🔄 Client ${clientId} mis à jour: ${syncClient.name}`);
          } else {
            // Le client n'existe pas, le créer
            const insertQuery = `
              INSERT INTO clients (
                customer_id, company_name, firstname, lastname, email, phone, mobile, siret, notes, 
                created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
              RETURNING id
            `;

            const result = await client.query(insertQuery, [
              clientId,
              syncClient.name || '',
              syncClient.firstname || '',
              syncClient.lastname || '',
              syncClient.email,
              syncClient.phone || null,
              syncClient.mobile || null,
              syncClient.siret || null,
              syncClient.notes || null
            ]);

            clientsSynchronized++;
            this.logger.log(`✅ Client ${clientId} créé: ${syncClient.name} → app_id: ${result.rows[0].id}`);
          }

        } catch (error) {
          const errorMsg = `Erreur lors de la synchronisation du client ${clientId}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Synchronisation forcée terminée en ${duration}ms: ${clientsSynchronized} créés, ${clientsUpdated} mis à jour`);

    } catch (error) {
      const errorMsg = `Erreur fatale lors de la synchronisation forcée: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      this.logger.error(errorMsg);
    } finally {
      client.release();
    }

    return {
      success: errors.length === 0,
      clients_processed: clientsProcessed,
      clients_synchronized: clientsSynchronized,
      clients_updated: clientsUpdated,
      errors
    };
  }
} 