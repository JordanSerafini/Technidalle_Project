import { Logger } from '@nestjs/common';
import { DealInterface } from '../../interfaces/Deal/deal.interface';
import { DealToProjectMapper } from '../../sync/mappers/deal-to-project.mapper';
import * as pgClientSource from '../../clients/PgClient';
import { ProjectAPP } from '../../interfaces/projects/projectAPP';
import { QueryService } from '../../services/query.service';
import { ClientSyncService } from '../../services/client-sync.service';
import { Customer } from '../../interfaces/clients/clientEBP';
import { Client } from '../../interfaces/clients/clientApp';

// Interfaces pour typer les résultats des requêtes SQL
interface SchemaResultRow {
  nspname: string;
}

interface TableResultRow {
  table_schema: string;
  table_name: string;
}

interface ClientResultRow {
  id: string;
  customer_id: string;
}

export default class EBPDeal {
  private readonly logger = new Logger(EBPDeal.name);
  private dealMapper: DealToProjectMapper;
  private queryService: QueryService;
  private clientSyncService: ClientSyncService;

  constructor(
    queryService: QueryService,
    clientSyncService: ClientSyncService,
  ) {
    this.queryService = queryService;
    this.clientSyncService = clientSyncService;
    this.dealMapper = DealToProjectMapper.getInstance();
    this.logger.log('EBPDeal initialized');
  }

  /**
   * Récupère toutes les affaires (deals) depuis la base EBP
   */
  async getAllDealsFromEBP(): Promise<DealInterface[]> {
    this.logger.log('Début de getAllDealsFromEBP');
    try {
      // Utiliser le client pgClientSource pour accéder à la base EBP
      const ebpDealsResult = await pgClientSource.executeQuery(`
        SELECT * FROM "Deal"
      `);

      this.logger.log(
        `Récupération de ${ebpDealsResult.length} affaires depuis EBP`,
      );
      return ebpDealsResult as DealInterface[];
    } catch (error) {
      this.logger.error(
        'Erreur lors de la récupération des affaires depuis EBP:',
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
      throw error; // Propager l'erreur au lieu de retourner un tableau vide
    }
  }

  /**
   * Récupère une affaire spécifique par son ID
   */
  async getDealByIdFromEBP(dealId: string): Promise<DealInterface | null> {
    this.logger.log(`Récupération de l'affaire avec ID: ${dealId}`);
    try {
      const ebpDealResult = await pgClientSource.executeQuery(
        `SELECT * FROM "Deal" WHERE "Id" = $1`,
        [dealId],
      );

      if (ebpDealResult.length === 0) {
        this.logger.warn(`Aucune affaire trouvée avec l'ID: ${dealId}`);
        return null;
      }

      return ebpDealResult[0] as DealInterface;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération de l'affaire avec ID ${dealId}:`,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  /**
   * Convertit une affaire EBP en projet format application
   */
  convertToAppProject(dealEBP: DealInterface): Partial<ProjectAPP> {
    // On doit s'assurer que le client_id est toujours de type string
    const result = this.dealMapper.map(dealEBP);

    // Convertir client_id en string si c'est un nombre
    if (typeof result.client_id === 'number') {
      result.client_id = String(result.client_id);
    }

    return result as unknown as Partial<ProjectAPP>;
  }

  /**
   * Convertit plusieurs affaires EBP en projets format application
   */
  convertMultipleToAppProject(
    dealsEBP: DealInterface[],
  ): Partial<ProjectAPP>[] {
    return dealsEBP.map((deal) => this.convertToAppProject(deal));
  }

  /**
   * Insère ou met à jour une affaire EBP dans la base App (sous forme de projet)
   */
  async insertDealIntoApp(dealData: DealInterface): Promise<string | null> {
    try {
      // S'assurer que les tables existent
      const tablesReady = await this.createTablesIfNotExist();
      if (!tablesReady) {
        this.logger.error(
          'Impossible de créer ou vérifier les tables nécessaires',
        );
        return null;
      }

      // Commencer la transaction
      await this.queryService.executeQuery('BEGIN');

      try {
        const schemasResult =
          await this.queryService.executeQuery<SchemaResultRow>(
            `SELECT nspname FROM pg_catalog.pg_namespace`,
          );

        const schemaNames = schemasResult.rows?.map((r) => r.nspname) || [];

        this.logger.log(`Schémas disponibles: ${JSON.stringify(schemaNames)}`);

        const tablesResult =
          await this.queryService.executeQuery<TableResultRow>(
            "SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'",
          );

        const relevantTables =
          tablesResult.rows?.filter(
            (r) => r.table_name === 'clients' || r.table_name === 'projects',
          ) || [];

        this.logger.log(
          `Tables disponibles: ${JSON.stringify(relevantTables)}`,
        );
      } catch (error) {
        this.logger.error(
          `Erreur lors de la vérification des schémas/tables: ${error instanceof Error ? error.message : String(error)}`,
        );
        // En cas d'erreur, annuler la transaction et sortir
        await this.queryService.executeQuery('ROLLBACK');
        return null;
      }

      // 1. Récupérer ou créer le client
      let clientId: number | null = null;
      const ebpClientId = dealData.xx_Client
        ? String(dealData.xx_Client).trim()
        : null;

      if (ebpClientId !== null && ebpClientId !== '') {
        // Procéder seulement si xx_Client a une valeur non nulle et non vide après trim
        // Log de la valeur recherchée
        this.logger.log(`Recherche du client avec xx_Client = ${ebpClientId}`);

        // Essayer de trouver le client existant par customer_id
        const searchClientQuery = `
          SELECT "id" FROM public."clients"
          WHERE "customer_id" = $1
          LIMIT 1
        `;

        try {
          const clientResult = await this.queryService
            .executeQuery<{ id: number }>(searchClientQuery, [ebpClientId])
            .catch((err) => {
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              this.logger.error(
                `Erreur lors de la recherche du client ${ebpClientId}: ${errorMessage}`,
              );
              return { rows: [] };
            });

          if (clientResult.rows && clientResult.rows.length > 0) {
            clientId = clientResult.rows[0].id;
            this.logger.log(
              `Client trouvé avec ID: ${clientId} pour l'affaire ${dealData.Id}`,
            );
          } else {
            this.logger.warn(
              `Client ${ebpClientId} non trouvé, tentative de création.`,
            );

            // Tenter de récupérer les informations complètes du client depuis EBP
            try {
              const ebpClientResult = await pgClientSource.executeQuery(
                'SELECT * FROM "Customer" WHERE "Id" = $1',
                [dealData.xx_Client],
              );

              if (ebpClientResult.length > 0) {
                const ebpClient = ebpClientResult[0] as Customer;

                // Préparer les données du nouveau client pour l'insertion
                // Assurez-vous que customer_id est une string non-null ici
                const newClientData: Partial<Client> = {
                  customer_id: ebpClientId,
                  company_name: ebpClient.Name,
                  firstname:
                    ebpClient.MainInvoicingContact_Firstname ?? undefined,
                  lastname: ebpClient.MainInvoicingContact_Name ?? undefined,
                  email:
                    ebpClient.MainInvoicingContact_Email ||
                    `no-email-${ebpClientId}@example.com`,
                  phone: ebpClient.MainInvoicingContact_Phone || null,
                  siret: ebpClient.Siren || null,
                  notes: ebpClient.NotesClear || ebpClient.Notes || null,
                };

                // Insérer le nouveau client
                const insertFields = Object.keys(newClientData)
                  .filter(
                    (key) =>
                      newClientData[key as keyof typeof newClientData] !==
                      undefined,
                  )
                  .map((key) => `"${key}"`)
                  .join(', ');

                const insertValuesPlaceholder = Object.keys(newClientData)
                  .filter(
                    (key) =>
                      newClientData[key as keyof typeof newClientData] !==
                      undefined,
                  )
                  .map((_, index) => `$${index + 1}`)
                  .join(', ');

                const insertValues = Object.values(newClientData).filter(
                  (value) => value !== undefined,
                );

                if (insertFields.length > 0) {
                  const insertClientQuery = `
                    INSERT INTO public."clients" (
                       ${insertFields},
                       "created_at",
                       "updated_at"
                     ) VALUES (
                       ${insertValuesPlaceholder},
                       CURRENT_TIMESTAMP,
                       CURRENT_TIMESTAMP
                     ) RETURNING id; -- Retourner l'ID du nouvel enregistrement
                  `;

                  const newClientResult = await this.queryService.executeQuery<{
                    id: number;
                  }>(insertClientQuery, insertValues);
                  if (newClientResult.rows && newClientResult.rows.length > 0) {
                    clientId = newClientResult.rows[0].id;
                    this.logger.log(
                      `Nouveau client créé avec ID: ${clientId} pour l'affaire ${dealData.Id}`,
                    );
                  } else {
                    this.logger.error(
                      `Échec de la récupération de l'ID du nouveau client pour l'affaire ${dealData.Id}`,
                    );
                  }
                } else {
                  this.logger.warn(
                    `Aucun champ valide pour créer un nouveau client EBP ${ebpClientId} pour l'affaire ${dealData.Id}`,
                  );
                }
              } else {
                this.logger.warn(
                  `Client EBP ${dealData.xx_Client} introuvable pour récupération des détails pour l'affaire ${dealData.Id}.`,
                );
              }
            } catch (createClientError) {
              this.logger.error(
                `Erreur lors de la création du client pour l'affaire ${dealData.Id}: ${createClientError instanceof Error ? createClientError.message : String(createClientError)}`,
                createClientError instanceof Error
                  ? createClientError.stack
                  : undefined,
              );
            }
          }
        } catch (searchClientError) {
          this.logger.error(
            `Erreur lors de la recherche initiale du client pour l'affaire ${dealData.Id}: ${searchClientError instanceof Error ? searchClientError.message : String(searchClientError)}`,
            searchClientError instanceof Error
              ? searchClientError.stack
              : undefined,
          );
        }
      } else {
        // Si xx_Client est nul ou vide dans l'affaire EBP
        this.logger.warn(
          `L'affaire ${dealData.Id} n'a pas de client associé (xx_Client). L'affaire sera ignorée.`,
        );
        // Annuler la transaction et retourner null car on ne peut pas insérer le projet sans client
        await this.queryService.executeQuery('ROLLBACK');
        return null;
      }

      // Si clientId est toujours null ici (client existant non trouvé ET création échouée),
      // cela signifie que le client n'a pas pu être associé. Annuler la transaction et ignorer l'affaire.
      if (clientId === null) {
        this.logger.warn(
          `Impossible de trouver ou créer un client pour l'affaire ${dealData.Id}. L'affaire sera ignorée.`,
        );
        await this.queryService.executeQuery('ROLLBACK');
        return null; // Ne pas insérer le projet
      }

      // 2. Convertir l'affaire en projet en utilisant le clientId trouvé ou créé
      const projectData = this.dealMapper.map(dealData, clientId);

      // 3. Insérer ou mettre à jour le projet
      const insertProjectQuery = `
        INSERT INTO public."projects" (
          "client_id", "name", "reference", "description", "start_date", "end_date",
          "status", "deal_id", "created_at", "updated_at", "synced_at", "synced_by_device_id"
        ) VALUES (
          ${clientId},
          '${projectData.name?.replace(/'/g, "''")}',
          '${dealData.Id}',
          ${projectData.description ? `'${projectData.description.replace(/'/g, "''")}'` : 'NULL'},
          '${dealData.DealDate.toISOString()}',
          ${dealData.xx_DateFin ? `'${dealData.xx_DateFin.toISOString()}'` : 'NULL'},
          '${projectData.status || 'prospect'}',
          '${dealData.Id}',
          NOW(),
          NOW(),
          NOW(),
          'sync_service'
        )
        ON CONFLICT ("deal_id") DO UPDATE SET
          "client_id" = EXCLUDED."client_id",
          "name" = EXCLUDED."name",
          "reference" = EXCLUDED."reference",
          "description" = EXCLUDED."description",
          "start_date" = EXCLUDED."start_date",
          "end_date" = EXCLUDED."end_date",
          "status" = EXCLUDED."status",
          "updated_at" = NOW(),
          "synced_at" = NOW(),
          "synced_by_device_id" = 'sync_service';
      `;

      await this.queryService.executeQuery(insertProjectQuery);

      // Committer la transaction
      await this.queryService.executeQuery('COMMIT');
      this.logger.log(`Affaire ${dealData.Id} synchronisée avec succès`);
      return dealData.Id;
    } catch (transactionError) {
      // Annuler la transaction en cas d'erreur
      await this.queryService.executeQuery('ROLLBACK');
      this.logger.error(
        `Erreur de transaction lors de la synchronisation de l'affaire ${dealData.Id}: ${transactionError instanceof Error ? transactionError.message : String(transactionError)}`,
      );
      return null;
    }
  }

  /**
   * Crée les tables nécessaires pour la synchronisation
   */
  async createTablesIfNotExist(): Promise<boolean> {
    try {
      // Vérifier et créer la table clients si elle n'existe pas
      const createClientsTable = `
        CREATE TABLE IF NOT EXISTS public."clients" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL,
          "customer_id" VARCHAR(50) UNIQUE,
          "email" VARCHAR(255),
          "phone" VARCHAR(50),
          "address" VARCHAR(255),
          "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await this.queryService.executeQuery(createClientsTable);

      // Vérifier et créer la table projects si elle n'existe pas
      const createProjectsTable = `
        CREATE TABLE IF NOT EXISTS public."projects" (
          "id" SERIAL PRIMARY KEY,
          "project_id" VARCHAR(255),
          "external_ebp_id" VARCHAR(50) UNIQUE,
          "name" VARCHAR(255) NOT NULL,
          "reference" VARCHAR(100),
          "description" TEXT,
          "status" VARCHAR(50),
          "client_id" VARCHAR(50),
          "start_date" TIMESTAMP,
          "end_date" TIMESTAMP,
          "estimated_duration" INTEGER,
          "budget" DECIMAL(15,2),
          "actual_cost" DECIMAL(15,2),
          "margin" DECIMAL(15,2),
          "notes" TEXT,
          "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await this.queryService.executeQuery(createProjectsTable);

      this.logger.log(
        'Tables clients et projects créées ou vérifiées avec succès',
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création des tables: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }

  /**
   * Synchronise les clients depuis EBP vers la base App
   *
   * @returns boolean - True si la synchronisation s'est déroulée sans erreurs majeures, false sinon.
   */
  async syncClientsFromEBP(): Promise<boolean> {
    this.logger.log('Début de syncClientsFromEBP');
    let success = true;
    try {
      // Récupérer tous les clients depuis EBP
      const ebpClientsResult = await pgClientSource.executeQuery(
        `SELECT * FROM "Customer"`,
      );

      const ebpClients = ebpClientsResult as Customer[]; // Assertion de type pour travailler avec l'interface Customer

      this.logger.log(
        `Récupération de ${ebpClients.length} clients depuis EBP`,
      );

      // Insérer ou mettre à jour chaque client dans la table clients
      let successCount = 0;
      for (const ebpClient of ebpClients) {
        try {
          // Normaliser l'ID du client pour éviter les problèmes de casse
          const clientId = ebpClient.Id ? String(ebpClient.Id).trim() : null;

          if (!clientId) {
            this.logger.warn(`Client sans ID ignoré`);
            continue; // Ignorer ce client et passer au suivant
          }

          // Log de l'ID du client EBP pour le suivi
          this.logger.log(`Traitement du client EBP avec ID: ${clientId}`);

          // Rechercher le client dans notre base par son customer_id
          const existingClient =
            await this.queryService.executeQuery<ClientResultRow>(
              `SELECT "id", "customer_id" FROM public."clients" WHERE "customer_id" = $1`, // Ajout de customer_id dans SELECT
              [clientId],
            );

          // Préparer les données du client pour la base App
          const clientData: Partial<Client> = {
            customer_id: clientId,
            company_name: ebpClient.Name, // Mappe Name à company_name
            firstname: ebpClient.MainInvoicingContact_Firstname ?? undefined,
            lastname: ebpClient.MainInvoicingContact_Name ?? undefined,
            email:
              ebpClient.MainInvoicingContact_Email ||
              `no-email-${clientId}@example.com`,
            phone: ebpClient.MainInvoicingContact_Phone || null,
            siret: ebpClient.Siren || null, // Mappe Siren à siret
            notes: ebpClient.NotesClear || ebpClient.Notes || null, // Mappe NotesClear ou Notes à notes
          };

          if (existingClient.rows && existingClient.rows.length > 0) {
            // Mettre à jour le client existant
            this.logger.log(
              `Client trouvé dans la base: ${existingClient.rows[0].customer_id} (ID: ${existingClient.rows[0].id})`,
            );

            // Construire la requête UPDATE dynamiquement pour inclure seulement les champs définis
            const updateFields = Object.keys(clientData)
              .filter(
                (key) =>
                  clientData[key as keyof typeof clientData] !== undefined,
              ) // Inclure seulement les champs définis
              .map((key, index) => `"${key}" = $${index + 1}`)
              .join(', ');

            const updateValues = Object.values(clientData).filter(
              (value) => value !== undefined,
            ); // Inclure seulement les valeurs définies

            if (updateFields.length > 0) {
              await this.queryService.executeQuery(
                `UPDATE public."clients" SET
                  ${updateFields},
                  "updated_at" = CURRENT_TIMESTAMP
                WHERE "id" = $${updateValues.length + 1}`,
                [...updateValues, existingClient.rows[0].id],
              );
              successCount++;
            } else {
              this.logger.log(
                `Aucun champ à mettre à jour pour le client ${clientId}`,
              );
              successCount++; // Compter comme succès même si pas de mise à jour
            }
          } else {
            // Créer un nouveau client
            this.logger.log(
              `Client ${clientId} non trouvé dans la base, création...`,
            );

            // Construire la requête INSERT dynamiquement
            const insertFields = Object.keys(clientData)
              .filter(
                (key) =>
                  clientData[key as keyof typeof clientData] !== undefined,
              ) // Inclure seulement les champs définis
              .map((key) => `"${key}"`) // Mettre les noms de colonnes entre guillemets
              .join(', ');

            const insertValuesPlaceholder = Object.keys(clientData)
              .filter(
                (key) =>
                  clientData[key as keyof typeof clientData] !== undefined,
              ) // Inclure seulement les champs définis
              .map((_, index) => `$${index + 1}`)
              .join(', ');

            const insertValues = Object.values(clientData).filter(
              (value) => value !== undefined,
            ); // Inclure seulement les valeurs définies

            if (insertFields.length > 0) {
              await this.queryService.executeQuery(
                `INSERT INTO public."clients" (
                   ${insertFields},
                   "created_at",
                   "updated_at"
                 ) VALUES (
                   ${insertValuesPlaceholder},
                   CURRENT_TIMESTAMP,
                   CURRENT_TIMESTAMP
                 )`,
                insertValues,
              );
              successCount++;
            } else {
              this.logger.warn(
                `Aucun champ valide pour créer un nouveau client avec ID ${clientId}`,
              );
              success = false; // Marquer comme échec si pas de champs pour créer le client
            }
          }
        } catch (error) {
          this.logger.error(
            `Erreur lors de la synchronisation du client ${ebpClient.Id}: ${
              // ebpClient est maintenant typé comme Customer
              error instanceof Error ? error.message : String(error)
            }`,
          );
          success = false; // Marquer la synchronisation des clients comme échouée si une erreur se produit
        }
      }

      this.logger.log(
        `Synchronisation des clients terminée: ${successCount}/${ebpClients.length} réussis`,
      );
      return success; // Retourner le statut global de succès
    } catch (error) {
      this.logger.error(
        `Erreur globale lors de la synchronisation des clients: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false; // Retourner false en cas d'erreur globale
    }
  }

  /**
   * Vérifie l'état des projets et tente de corriger ceux qui n'ont pas de client_id
   *
   * @returns Promise<{ count: number; fixed: number; }>
   */
  async verifyProjects(): Promise<{
    count: number;
    fixed: number;
  }> {
    this.logger.log('Début de verifyProjects');
    let fixedCount = 0;
    try {
      // Récupérer tous les projets sans client_id mais avec deal_id ou external_ebp_id
      const projectsToVerifyResult = await this.queryService.executeQuery<{
        id: number;
        deal_id?: string;
        external_ebp_id?: string; // Garder pour compatibilité si la colonne existe toujours
        reference?: string; // Ajouter pour vérification future si nécessaire
        customer_id?: string; // Ajouter pour vérification future si nécessaire
      }>(
        `SELECT id, deal_id, external_ebp_id, reference, customer_id FROM public."projects" WHERE customer_id IS NULL AND (deal_id IS NOT NULL OR external_ebp_id IS NOT NULL)`,
      );

      const projectsToVerify = projectsToVerifyResult.rows || [];

      this.logger.log(
        `Trouvé ${projectsToVerify.length} projets à vérifier pour le client_id manquant`,
      );

      for (const project of projectsToVerify) {
        // Déterminer l'ID EBP à utiliser pour la recherche du client
        const ebpId = project.deal_id || project.external_ebp_id;

        if (!ebpId) {
          this.logger.warn(
            `Projet ${project.id} sans deal_id ou external_ebp_id, impossible de vérifier le client.`,
          );
          continue;
        }

        try {
          // Récupérer l'affaire EBP correspondante
          const dealEBP = await this.getDealByIdFromEBP(ebpId);

          if (dealEBP && dealEBP.xx_Client) {
            const clientIdToSearch = String(dealEBP.xx_Client).trim();

            // Rechercher le client dans notre base par son customer_id
            const clientResult =
              await this.queryService.executeQuery<ClientResultRow>(
                `SELECT "id", "customer_id" FROM public."clients" WHERE "customer_id" = $1`, // Ajout de customer_id dans SELECT
                [clientIdToSearch],
              );

            if (clientResult.rows && clientResult.rows.length > 0) {
              const foundClientId = parseInt(clientResult.rows[0].id, 10);
              // Mettre à jour le projet avec le client_id trouvé
              await this.queryService.executeQuery(
                `UPDATE public."projects" SET "customer_id" = $1 WHERE "id" = $2`,
                [foundClientId, project.id],
              );
              this.logger.log(
                `Projet ${project.id} mis à jour avec le client_id ${foundClientId}.`,
              );
              fixedCount++;
            } else {
              this.logger.warn(
                `Client ${clientIdToSearch} (EBP xx_Client) non trouvé dans notre base pour le projet ${project.id}.`,
              );
            }
          } else {
            this.logger.warn(
              `Affaire EBP ${ebpId} introuvable ou sans client associé (xx_Client) pour le projet ${project.id}.`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Erreur lors de la vérification du projet ${project.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      const totalProjects = await this.queryService.executeQuery<{
        count: string;
      }>(`SELECT COUNT(*) FROM public."projects"`);

      const count = totalProjects.rows
        ? parseInt(totalProjects.rows[0].count, 10)
        : 0;

      this.logger.log(
        `Vérification des projets terminée: ${fixedCount} projets corrigés.`,
      );

      return {
        count,
        fixed: fixedCount,
      };
    } catch (error) {
      this.logger.error(
        `Erreur globale lors de la vérification des projets: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        count: 0,
        fixed: 0,
      };
    }
  }

  /**
   * Synchronise rapidement toutes les affaires depuis EBP vers la base App en une seule transaction.
   * Idéal pour les synchronisations initiales ou massives.
   *
   * @returns Promise<{ processed: number; succeeded: number; failed: number; details: string; }>
   */
  async fastSyncAllDeals(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    details: string;
  }> {
    this.logger.log('Début de fastSyncAllDeals');
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const failedDeals: string[] = [];

    // Créer un script SQL pour insérer toutes les affaires en une seule transaction
    let sqlScript = `BEGIN;
`;

    try {
      // Récupérer toutes les affaires depuis EBP
      const ebpDealsResult =
        await pgClientSource.executeQuery(`SELECT * FROM "Deal"`);
      const ebpDeals = ebpDealsResult as DealInterface[]; // Assertion de type
      processed = ebpDeals.length;
      this.logger.log(
        `Récupération de ${processed} affaires depuis EBP pour fast sync`,
      );

      // Fetch app clients once to create a map for faster lookup
      const appClientsResult = await this.queryService.executeQuery<{ id: number; customer_id: string }>(`SELECT id, customer_id FROM public."clients"`);
      const clientMap = new Map(appClientsResult.rows?.map(c => [c.customer_id.trim(), c.id])); // Trim customer_id from DB too

      for (const deal of ebpDeals) {
        const dealId = String(deal.Id).replace(/'/g, "''");
        const name = deal.Caption
          ? String(deal.Caption).replace(/'/g, "''")
          : `Projet ${dealId}`;

        const ebpClientId = deal.xx_Client
          ? String(deal.xx_Client).trim()
          : null;

        let internalClientId: number | null = null;

        // Check if ebpClientId is valid and lookup client
        if (ebpClientId && ebpClientId !== '') {
            internalClientId = clientMap.get(ebpClientId) || null;
            if (internalClientId === null) {
                 this.logger.warn(
                     `Client with customer_id ${ebpClientId} not found in app DB for deal ${dealId}. Skipping project insertion.`,
                 );
                failed++;
                failedDeals.push(dealId);
                continue; // Skip to the next deal
            }
        } else {
             this.logger.warn(
                 `Deal ${dealId} has no valid xx_Client. Skipping project insertion.`,
             );
            failed++;
            failedDeals.push(dealId);
            continue; // Skip to the next deal
        }

        // Mappage du statut EBP (numérique) vers le statut de l'application (enum string)
        const projectStatus = this.mapEbpDealStateToProjectStatus(
          deal.DealState,
        );

        const reference = dealId; // Use dealId for the reference column

        const description =
          deal.NotesClear || deal.Notes
            ? String(deal.NotesClear || deal.Notes).replace(/'/g, "''")
            : null;

        // Calculate start and end dates, handle potential invalid end date
        const startDateIso = deal.DealDate.toISOString();
        let endDateValue = 'NULL';
        if (deal.xx_DateFin && new Date(deal.xx_DateFin) >= new Date(deal.DealDate)) {
             endDateValue = `'${deal.xx_DateFin.toISOString()}'`;
        } else if (deal.xx_DateFin) {
             this.logger.warn(`Deal ${dealId} has an end date (${deal.xx_DateFin.toISOString()}) before the start date (${startDateIso}). Setting end_date to NULL.`);
        }

        sqlScript += `
          INSERT INTO public."projects" (
            "client_id", "name", "reference", "description", "start_date", "end_date",
            "status", "created_at", "updated_at" -- Removed synced_at, synced_by_device_id
          ) VALUES (
            ${internalClientId}, -- Use internalClientId (number)
            '${name}',
            '${reference}', -- Insert dealId into reference
            ${description ? `'${description}'` : 'NULL'},
            '${startDateIso}', -- Use calculated start date
            ${endDateValue}, -- Use calculated end date value
            '${projectStatus}', -- Utiliser 'prospect' comme état par défaut si null ou vide
            NOW(),
            NOW() -- Removed synced_at, synced_by_device_id
          )
          ON CONFLICT ("reference") DO UPDATE SET
            "client_id" = EXCLUDED."client_id",
            "name" = EXCLUDED."name",
            "reference" = EXCLUDED."reference",
            "description" = EXCLUDED."description",
            "start_date" = EXCLUDED."start_date",
            "end_date" = EXCLUDED."end_date", -- This will use the calculated end date from the INSERT part
            "status" = EXCLUDED."status",
            "updated_at" = NOW(); -- Removed synced_at, synced_by_device_id

        `;
         succeeded++; // Increment succeeded count as we are adding to the script
      }

      sqlScript += `COMMIT;
`;

      // Exécuter le script pour toutes les affaires en une seule transaction
      if (succeeded > 0) { // Only execute if there are projects to insert
          try {
            this.logger.log(
              `Exécution de la transaction pour ${succeeded} affaires`,
            );
            await this.queryService.executeQuery(sqlScript);
            this.logger.log(
              `Transaction terminée avec succès pour ${succeeded} affaires`,
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            this.logger.error(
              `Erreur lors de l'exécution de la transaction: ${errorMessage}`,
            );
            // Annuler la transaction en cas d'erreur
            await this.queryService.executeQuery('ROLLBACK');
             // If the transaction fails, all succeeded deals in this batch are actually failed
            failed += succeeded;
            succeeded = 0;

            return {
              processed,
              succeeded: 0,
              failed: processed, // Mark all as failed on transaction error
              details: `Erreur lors de l'exécution de la transaction: ${errorMessage}`,
            };
          }
      } else {
           this.logger.log('No valid deals to insert into projects table.');
      }

      return {
        processed,
        succeeded,
        failed,
        details: failedDeals.length > 0 ? `Failed to process deals: ${failedDeals.join(', ')}` : 'Fast sync completed successfully',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Erreur globale lors du fast sync: ${errorMessage}`);

      // Attempt to rollback if BEGIN was executed but COMMIT failed
      if (sqlScript.startsWith('BEGIN;') && !sqlScript.endsWith('COMMIT;\n')) {
           try {
                await this.queryService.executeQuery('ROLLBACK');
                this.logger.log('Rolled back transaction due to global error.');
           } catch (rollbackError) {
                this.logger.error(
                    `Error during rollback: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
                );
           }
      }

      return {
        processed: 0, // Cannot determine how many were processed before the global error
        succeeded: 0,
        failed: processed > 0 ? processed : 0, // Assume all processed failed if we know the count, else 0
        details: `Erreur globale lors du fast sync: ${errorMessage}`,
      };
    }
  }

  /**
   * Exécute une synchronisation rapide de toutes les affaires et clients.
   *
   * @returns Promise<{ success: boolean; message: string; stats: { processed: number; succeeded: number; failed: number; }; }>
   */
  async runFastSync(): Promise<{
    success: boolean;
    message: string;
    stats: {
      processed: number;
      succeeded: number;
      failed: number;
    };
  }> {
    this.logger.log('Début du fast sync');

    // Synchroniser les clients en premier (cette étape est nécessaire)
    // On ne vérifie plus le résultat ici car syncClientsFromEBP gère ses propres erreurs et logging
    const clientSyncSuccess = await this.syncClientsFromEBP();
    if (!clientSyncSuccess) {
         this.logger.warn(
             'Client synchronization failed. Proceeding with deal sync might result in more errors.',
         );
    }

    // Vérifier l'état des projets avant de commencer
    // const { count: projectCountBefore } = await this.verifyProjects(); // Commented out for potential performance improvement during fast sync
    // this.logger.log(
    //   `Nombre de projets avant synchronisation: ${projectCountBefore}`,
    // );

    // Utiliser la méthode rapide pour les deals
    const startTime = Date.now();
    const result = await this.fastSyncAllDeals();
    const endTime = Date.now();

    // Calculer des statistiques de performance
    const durationSeconds = (endTime - startTime) / 1000;
    const dealsPerSecond =
      result.processed > 0
        ? (result.processed / durationSeconds).toFixed(2)
        : '0';

    this.logger.log(
      `Synchronisation terminée en ${durationSeconds.toFixed(2)}s (${dealsPerSecond} affaires/s)`,
    );

    // // Vérifier l'état des projets après la synchronisation pour voir si de nouveaux projets ont été ajoutés
    // const { count: projectCountAfter, fixed: projectsFixedAfter } = await this.verifyProjects(); // Re-run verifyProjects to fix any potential leftovers or inconsistencies
    // this.logger.log(
    //   `Nombre de projets après synchronisation: ${projectCountAfter}, ${projectsFixedAfter} corrigés par la vérification post-sync.`,
    // );

    if (result.failed === 0) {
      return {
        success: true,
        message: `Synchronisation terminée avec succès. ${result.succeeded}/${result.processed} affaires synchronisées en ${durationSeconds.toFixed(2)}s`,
        stats: {
          processed: result.processed,
          succeeded: result.succeeded,
          failed: result.failed,
        },
      };
    } else {
      return {
        success: false,
        message: `Synchronisation terminée avec des erreurs: ${result.failed} échecs. Détails: ${result.details}`,
        stats: {
          processed: result.processed,
          succeeded: result.succeeded,
          failed: result.failed,
        },
      };
    }
  }

  /**
   * Mappe l'état numérique d'une affaire EBP vers le statut de projet de l'application.
   * @param ebpDealState L'état numérique de l'affaire EBP.
   * @returns Le statut de projet correspondant ou 'prospect' par défaut.
   */
  private mapEbpDealStateToProjectStatus(ebpDealState?: number): string {
    switch (ebpDealState) {
      case 0: // Supposition: Brouillon/Prospect dans EBP
        return 'prospect';
      case 1: // Supposition: Devis en cours dans EBP
        return 'devis_en_cours';
      case 2: // Supposition: Devis accepté dans EBP
        return 'devis_accepte';
      case 3: // Supposition: En préparation dans EBP
        return 'en_preparation';
      case 4: // Supposition: En cours dans EBP
        return 'en_cours';
      case 5: // Supposition: En pause dans EBP
        return 'en_pause';
      case 6: // Supposition: Terminé dans EBP
        return 'termine';
      case 7: // Supposition: Annulé dans EBP (basé sur l'erreur précédente)
        return 'annule';
      default:
        this.logger.warn(
          `Unknown EBP DealState: ${ebpDealState}. Mapping to 'prospect'.`,
        );
        return 'prospect'; // Statut par défaut pour les valeurs inconnues
    }
  }
}
