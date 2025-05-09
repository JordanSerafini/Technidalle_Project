import { Logger } from '@nestjs/common';
import { DealInterface } from '../../interfaces/Deal/deal.interface';
import { DealToProjectMapper } from '../../sync/mappers/deal-to-project.mapper';
import * as pgClientSource from '../../clients/PgClient';
import { ProjectAPP } from '../../interfaces/projects/projectAPP';
import { QueryService } from '../../services/query.service';
import { ClientSyncService } from '../../services/client-sync.service';

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
        const schemasResult = await this.queryService.executeQuery(
          'SELECT nspname FROM pg_catalog.pg_namespace',
        );

        const schemaNames =
          schemasResult.rows?.map((r) => r.nspname as string) || [];

        this.logger.log(`Schémas disponibles: ${JSON.stringify(schemaNames)}`);

        const tablesResult = await this.queryService.executeQuery(
          "SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'",
        );

        const relevantTables =
          tablesResult.rows?.filter(
            (r) =>
              (r.table_name as string) === 'clients' ||
              (r.table_name as string) === 'projects',
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

      // Essayer de trouver le client existant par client_id (xx_Client au lieu de EbpClientReference)
      if (dealData.xx_Client) {
        try {
          const clientIdToSearch = dealData.xx_Client ? String(dealData.xx_Client).trim() : null;
          
          // Log de la valeur recherchée
          this.logger.log(
            `Recherche du client avec xx_Client = ${clientIdToSearch}`,
          );
          
          // Requête complète qui utilise différentes stratégies de recherche
          const searchClientQuery = `
            SELECT "id" FROM public."clients" 
            WHERE LOWER("external_ebp_customer_id") = LOWER($1)
            OR "external_ebp_customer_id" LIKE $2
            OR "external_ebp_customer_id" = $3
            LIMIT 1
          `;
          
          const clientResult = await this.queryService
            .executeQuery<{
              id: string;
            }>(searchClientQuery, [
              clientIdToSearch,         // Recherche exacte insensible à la casse
              `%${clientIdToSearch}%`,  // Recherche partielle
              clientIdToSearch,         // Recherche exacte
            ])
            .catch((err) => {
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              this.logger.error(
                `Erreur lors de la recherche du client: ${errorMessage}`,
              );
              return { rows: [] };
            });

          if (clientResult.rows && clientResult.rows.length > 0) {
            clientId = parseInt(clientResult.rows[0].id, 10);
            this.logger.log(
              `Client trouvé avec ID: ${clientId} pour l'affaire ${dealData.Id}`,
            );
          } else {
            this.logger.warn(
              `Client ${dealData.xx_Client} non trouvé, tentative de récupération depuis EBP`,
            );

            try {
              // Essayer de récupérer directement depuis la table Customer d'EBP
              const custResult = await pgClientSource.executeQuery(
                'SELECT "Id" FROM "Customer" WHERE "Id" = $1',
                [dealData.xx_Client],
              );

              if (custResult.length > 0) {
                clientId = parseInt(dealData.xx_Client, 10) || null;
                this.logger.log(
                  `Client EBP utilisé directement avec ID: ${clientId}`,
                );
              } else {
                this.logger.warn(
                  `Client EBP ${dealData.xx_Client} introuvable également.`,
                );
                clientId = null;
              }
            } catch (ebpError) {
              this.logger.error(
                `Erreur lors de la recherche du client EBP: ${ebpError instanceof Error ? ebpError.message : String(ebpError)}`,
              );
              clientId = null;
            }
          }
        } catch (error) {
          this.logger.error(
            `Erreur lors de la recherche du client: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );

          // En cas d'erreur grave, annuler la transaction et sortir
          await this.queryService.executeQuery('ROLLBACK');
          return null;
        }
      } else {
        this.logger.warn(
          `L'affaire ${dealData.Id} n'a pas de client associé (xx_Client)`,
        );
        clientId = null;
      }

      // 2. Convertir l'affaire en projet en forçant clientId à undefined si null
      const projectData = this.dealMapper.map(dealData, clientId || undefined);

      // Convertir client_id en string si c'est un nombre
      if (typeof projectData.client_id === 'number') {
        projectData.client_id = String(projectData.client_id);
      }

      // 3. Insérer/mettre à jour le projet
      try {
        // Vérifier si le projet existe déjà
        const checkProjectQuery = `
          SELECT "id" FROM public."projects"
          WHERE "external_ebp_id" = $1
        `;

        const checkResult = await this.queryService
          .executeQuery<{ id: string }>(checkProjectQuery, [dealData.Id])
          .catch((err) => {
            const errorMessage =
              err instanceof Error ? err.message : String(err);
            this.logger.error(
              `Erreur lors de la vérification de l'existence du projet: ${errorMessage}`,
            );
            // En cas d'erreur, annuler la transaction et sortir
            throw err; // Propager l'erreur pour être traitée dans le bloc catch externe
          });

        let projectResult;

        if (checkResult.rows && checkResult.rows.length > 0) {
          // Le projet existe déjà, faire un UPDATE
          const updateFields: string[] = [];
          const updateValues: any[] = [];
          let paramIndex = 1;

          Object.keys(projectData).forEach((key) => {
            if (
              key !== 'id' &&
              key !== 'external_ebp_id' &&
              projectData[key as keyof typeof projectData] !== undefined
            ) {
              updateFields.push(`"${key}" = $${paramIndex}`);
              updateValues.push(projectData[key as keyof typeof projectData]);
              paramIndex++;
            }
          });

          if (updateFields.length > 0) {
            const updateProjectQuery = `
              UPDATE public."projects" SET
              ${updateFields.join(', ')}
              WHERE "external_ebp_id" = $${paramIndex}
              RETURNING "external_ebp_id" as reference
            `;

            updateValues.push(dealData.Id);

            projectResult = await this.queryService
              .executeQuery<{
                reference: string;
              }>(updateProjectQuery, updateValues)
              .catch((err) => {
                const errorMessage =
                  err instanceof Error ? err.message : String(err);
                this.logger.error(
                  `Erreur lors de la mise à jour du projet: ${errorMessage}`,
                );
                // En cas d'erreur, annuler la transaction et sortir
                throw err; // Propager l'erreur pour être traitée dans le bloc catch externe
              });
          } else {
            // Pas de champs à mettre à jour
            projectResult = { rows: [{ reference: dealData.Id }] };
          }
        } else {
          // Le projet n'existe pas, faire un INSERT
          const insertProjectQuery = `
            INSERT INTO public."projects" (
              ${Object.keys(projectData)
                .map((k) => `"${k}"`)
                .join(', ')}
            ) VALUES (
              ${Object.keys(projectData)
                .map((_, i) => `$${i + 1}`)
                .join(', ')}
            )
            RETURNING "external_ebp_id" as reference
          `;

          projectResult = await this.queryService
            .executeQuery<{
              reference: string;
            }>(insertProjectQuery, Object.values(projectData))
            .catch((err) => {
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              this.logger.error(
                `Erreur lors de l'insertion du projet: ${errorMessage}`,
              );
              // En cas d'erreur, annuler la transaction et sortir
              throw err; // Propager l'erreur pour être traitée dans le bloc catch externe
            });
        }

        // Utiliser une référence par défaut si quelque chose a mal tourné (mais cette ligne ne devrait jamais être atteinte en cas d'erreur maintenant)
        const reference =
          (projectResult?.rows?.[0]?.reference as string) || dealData.Id;

        await this.queryService.executeQuery('COMMIT');
        this.logger.log(`Affaire ${dealData.Id} synchronisée avec succès`);

        return typeof reference === 'string' ? reference : String(reference);
      } catch (error) {
        this.logger.error(
          `Erreur lors de l'opération sur le projet: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
        // S'assurer que la transaction est annulée en cas d'erreur
        await this.queryService.executeQuery('ROLLBACK');
        return null;
      }
    } catch (error) {
      // S'assurer que toute erreur non gérée conduit à un ROLLBACK
      try {
        await this.queryService.executeQuery('ROLLBACK');
      } catch (rollbackError) {
        this.logger.error(
          `Erreur lors du ROLLBACK: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
        );
      }

      this.logger.error(
        `Erreur lors de l'insertion de l'affaire: ${dealData.Id}`,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
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
          "external_ebp_customer_id" VARCHAR(50) UNIQUE,
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
   * Synchronise les clients depuis EBP vers l'application
   */
  async syncClientsFromEBP(): Promise<boolean> {
    try {
      // Vérifier que la table clients existe
      const tablesReady = await this.createTablesIfNotExist();
      if (!tablesReady) {
        this.logger.error('Impossible de créer la table clients');
        return false;
      }

      // Récupérer tous les clients depuis EBP
      const ebpClientsResult = await pgClientSource.executeQuery(`
        SELECT * FROM "Customer"
      `);

      this.logger.log(
        `Récupération de ${ebpClientsResult.length} clients depuis EBP`,
      );

      // Insérer ou mettre à jour chaque client dans la table clients
      let successCount = 0;
      for (const ebpClient of ebpClientsResult) {
        try {
          // Normaliser l'ID du client pour éviter les problèmes de casse
          const clientId = ebpClient.Id ? String(ebpClient.Id).trim() : null;
          
          if (!clientId) {
            this.logger.warn(`Client sans ID ignoré`);
            continue;
          }
          
          this.logger.log(`Traitement du client EBP: ${clientId}`);
          
          // Vérifier si le client existe déjà (recherche insensible à la casse)
          const checkQuery = `
            SELECT "id", "external_ebp_customer_id", "name" 
            FROM public."clients" 
            WHERE LOWER("external_ebp_customer_id") = LOWER($1)
          `;
          
          const existingClient = await this.queryService.executeQuery<{ 
            id: string;
            external_ebp_customer_id: string;
            name: string;
          }>(checkQuery, [clientId]);

          // Préparer les données du client
          const clientName = ebpClient.Name || clientId;
          const clientEmail = ebpClient.Email || `no-email-${clientId}@example.com`;
          const clientPhone = ebpClient.Phone || null;
          const clientAddress = ebpClient.FullAddress || null;

          if (existingClient.rows && existingClient.rows.length > 0) {
            // Mettre à jour le client existant
            this.logger.log(`Client trouvé dans la base: ${existingClient.rows[0].external_ebp_customer_id} (ID: ${existingClient.rows[0].id})`);
            
            await this.queryService.executeQuery(
              `UPDATE public."clients" SET 
                "name" = $1,
                "email" = $2,
                "phone" = $3,
                "address" = $4,
                "external_ebp_customer_id" = $5,
                "updated_at" = CURRENT_TIMESTAMP
              WHERE "id" = $6`,
              [
                clientName,
                clientEmail,
                clientPhone,
                clientAddress,
                clientId, // S'assurer que l'ID est exactement comme dans EBP
                existingClient.rows[0].id,
              ],
            );
            this.logger.log(`Client ${clientId} mis à jour`);
          } else {
            // Essayer une recherche par nom si l'ID ne correspond pas
            const checkByNameQuery = `
              SELECT "id", "external_ebp_customer_id", "name" 
              FROM public."clients" 
              WHERE LOWER("name") = LOWER($1)
            `;
            
            const existingByName = await this.queryService.executeQuery<{ 
              id: string;
              external_ebp_customer_id: string;
              name: string;
            }>(checkByNameQuery, [clientName]);
            
            if (existingByName.rows && existingByName.rows.length > 0) {
              // Mettre à jour l'ID externe du client existant
              this.logger.log(`Client trouvé par nom: ${existingByName.rows[0].name} (ID: ${existingByName.rows[0].id})`);
              
              await this.queryService.executeQuery(
                `UPDATE public."clients" SET 
                  "external_ebp_customer_id" = $1,
                  "email" = $2,
                  "phone" = $3,
                  "address" = $4,
                  "updated_at" = CURRENT_TIMESTAMP
                WHERE "id" = $5`,
                [
                  clientId,
                  clientEmail,
                  clientPhone,
                  clientAddress,
                  existingByName.rows[0].id,
                ],
              );
              this.logger.log(`Client ${clientName} mis à jour avec l'ID externe ${clientId}`);
            } else {
              // Créer un nouveau client
              await this.queryService.executeQuery(
                `INSERT INTO public."clients" (
                  "name",
                  "external_ebp_customer_id",
                  "email",
                  "phone",
                  "address"
                ) VALUES ($1, $2, $3, $4, $5)`,
                [
                  clientName,
                  clientId,
                  clientEmail,
                  clientPhone,
                  clientAddress,
                ],
              );
              this.logger.log(`Nouveau client créé: ${clientName} (ID externe: ${clientId})`);
            }
          }
          successCount++;
        } catch (error) {
          this.logger.error(
            `Erreur lors de la synchronisation du client ${ebpClient.Id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      this.logger.log(
        `Synchronisation des clients terminée: ${successCount}/${ebpClientsResult.length} réussis`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la synchronisation des clients: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }

  /**
   * Attend pendant un certain nombre de millisecondes
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Synchronise toutes les affaires EBP vers l'application
   */
  async syncAllDeals(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    details: string;
  }> {
    this.logger.log('Début de la synchronisation des affaires EBP');

    // Vérifier et créer les tables si nécessaire
    const tablesReady = await this.createTablesIfNotExist();
    if (!tablesReady) {
      return {
        processed: 0,
        succeeded: 0,
        failed: 0,
        details: 'Erreur: Impossible de créer les tables nécessaires',
      };
    }

    // Synchroniser d'abord les clients depuis EBP
    await this.syncClientsFromEBP();

    try {
      // Charger les deals depuis EBP
      const deals = await this.getAllDealsFromEBP();
      
      let processed = 0;
      let succeeded = 0;
      let failed = 0;
      const errorMessages: string[] = [];
      
      // Traitement par lots de 25 affaires (plus petit pour éviter les timeouts)
      const batchSize = 10; // Réduire la taille du lot à 10 au lieu de 25
      const delayBetweenBatches = 1500; // Augmenter le délai entre les lots à 1.5 secondes
      this.logger.log(
        `Traitement de ${deals.length} affaires par lots de ${batchSize} avec ${delayBetweenBatches}ms de délai entre les lots`,
      );
      
      // Diviser les affaires en lots
      const batches: DealInterface[][] = [];
      for (let i = 0; i < deals.length; i += batchSize) {
        batches.push(deals.slice(i, i + batchSize));
      }
      
      this.logger.log(`Nombre total de lots: ${batches.length}`);
      
      // Traiter chaque lot
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        this.logger.log(
          `Début du traitement du lot ${batchIndex + 1}/${batches.length} (${batch.length} affaires)`,
        );
        
        // Traitement séquentiel des affaires dans le lot avec gestion des erreurs
        for (const deal of batch) {
          try {
            processed++;
            
            // Afficher des informations sur l'affaire en cours de traitement
            this.logger.log(`Traitement de l'affaire ${deal.Id || 'sans ID'} (${processed}/${deals.length})`);
            
            // Traiter chaque affaire avec un timeout
            const dealPromise = this.insertDealIntoApp(deal);
            
            // Définir un timeout de 15 secondes pour chaque affaire (réduit de 30s)
            const timeoutPromise = new Promise<null>((_, reject) => {
              setTimeout(() => reject(new Error(`Timeout lors du traitement de l'affaire ${deal.Id}`)), 15000);
            });
            
            // Attendre que l'une des promesses se termine
            const result = await Promise.race([dealPromise, timeoutPromise]);
            
            if (result) {
              succeeded++;
              this.logger.log(`Succès pour l'affaire ${deal.Id}`);
            } else {
              failed++;
              errorMessages.push(`Échec pour l'affaire ${deal.Id}`);
              this.logger.warn(`Échec pour l'affaire ${deal.Id}`);
            }
          } catch (error) {
            failed++;
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            this.logger.error(
              `Erreur lors du traitement de l'affaire ${deal.Id}: ${errorMessage}`,
            );
            errorMessages.push(`Erreur pour l'affaire ${deal.Id}: ${errorMessage}`);
            
            // Continuer malgré l'erreur
            continue;
          }
          
          // Log de progression
          if (processed % 5 === 0 || processed === deals.length) {
            this.logger.log(`Progression: ${processed}/${deals.length} (${Math.round((processed / deals.length) * 100)}%)`);
          }
        }
        
        // Log de fin de lot
        this.logger.log(`Lot ${batchIndex + 1}/${batches.length} terminé: ${succeeded} réussis, ${failed} échoués sur ${processed} traités`);
        
        // Attendre un peu entre les lots pour réduire la charge
        if (batchIndex < batches.length - 1) {
          this.logger.log(`Attente de ${delayBetweenBatches}ms avant le prochain lot...`);
          await this.delay(delayBetweenBatches);
        }
      }

      const details =
        errorMessages.length > 0 ? `Erreurs: ${errorMessages.join('; ')}` : '';

      return {
        processed,
        succeeded,
        failed,
        details,
      };
    } catch (error) {
      // Attraper les erreurs globales pour éviter que tout le processus ne s'arrête
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erreur globale lors de la synchronisation: ${errorMessage}`);
      
      return {
        processed: 0,
        succeeded: 0,
        failed: 0,
        details: `Erreur globale: ${errorMessage}`,
      };
    }
  }
}
