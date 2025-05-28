import { Logger } from '@nestjs/common';
import { ProjectEBP } from '../../interfaces/projects/projectEBP';
import {
  ProjectAPP,
  ProjectMapper,
} from '../../interfaces/projects/projectAPP';
import EBPclient from '../clients/ebpClient';
import { ConstructionsiteInterface } from '../../interfaces/projects/constructionSite';
import { QueryService } from '../../services/query.service';
import { ClientSyncService } from '../../services/client-sync.service';
import { CreateClientWithAddressDto } from '../../interfaces/clients/clientApp';
import PgClient2 from '../../clients/pgClient_2';
import { QueryResult } from 'pg';

interface ConstructionSiteReferenceDocument {
  Id?: string;
  ConstructionSiteId?: string;
}

export default class EBPProject {
  private readonly logger = new Logger(EBPProject.name);
  private ebpClient: EBPclient;
  private queryService: QueryService;
  private clientSync: ClientSyncService;

  constructor(queryService: QueryService, clientSync: ClientSyncService) {
    this.ebpClient = new EBPclient();
    this.queryService = queryService;
    this.clientSync = clientSync;
    this.logger.log('EBPProject initialized');
  }

  /**
   * Convertit un projet EBP en projet format application
   */
  convertToAppProject(projectEBP: ProjectEBP): ProjectAPP {
    return ProjectMapper.fromEBP(projectEBP);
  }

  /**
   * Convertit plusieurs projets EBP en projets format application
   */
  convertMultipleToAppProject(projectsEBP: ProjectEBP[]): ProjectAPP[] {
    return projectsEBP.map((project) => this.convertToAppProject(project));
  }

  /**
   * Récupère tous les projets depuis la base EBP
   */
  async getAllProjectsFromEBP(): Promise<ProjectEBP[]> {
    this.logger.log('Début de getAllProjectsFromEBP');
    try {
      this.logger.log('Appel de getAllConstructionSitesFromEBP');
      const rawConstructionSitesResult =
        await this.ebpClient.getAllConstructionSitesFromEBP();
      this.logger.log({
        message: 'Résultat brut de getAllConstructionSitesFromEBP',
        data: rawConstructionSitesResult,
      });

      if (rawConstructionSitesResult === undefined) {
        this.logger.error(
          'getAllConstructionSitesFromEBP a retourné undefined!',
        );
        throw new Error(
          'Erreur interne: La récupération des sites de construction a échoué silencieusement.',
        );
      }

      const constructionSites =
        rawConstructionSitesResult as ConstructionsiteInterface[];
      this.logger.log(
        `Récupéré ${constructionSites.length} sites de construction`,
      );

      this.logger.log(
        'Appel de getAllConstructionSiteReferenceDocumentsFromEBP',
      );
      const referenceDocuments =
        await this.ebpClient.getAllConstructionSiteReferenceDocumentsFromEBP();
      this.logger.log(
        `Récupéré ${referenceDocuments.length} documents de référence`,
      );

      const referenceDocsMap = new Map<
        string,
        ConstructionSiteReferenceDocument
      >();

      (referenceDocuments as ConstructionSiteReferenceDocument[]).forEach(
        (doc) => {
          if (doc?.ConstructionSiteId) {
            referenceDocsMap.set(doc.ConstructionSiteId, doc);
          }
        },
      );

      return constructionSites.map((site) => ({
        constructionSite: site,
      }));
    } catch (error) {
      this.logger.error('Erreur dans getAllProjectsFromEBP', error);
      throw error;
    }
  }

  /**
   * Récupère l'ID client interne de l'application à partir de l'ID client EBP
   */
  private async getAppClientIdFromEbpId(ebpClientId: string): Promise<string> {
    try {
      const clientQuery = `
        SELECT "Id" FROM "Customer"
        WHERE "Id" = $1
      `;

      const clientResult = await this.queryService.executeQuery<{ Id: string }>(
        clientQuery,
        [ebpClientId],
      );

      if (clientResult.rows.length > 0 && clientResult.rows[0]?.Id) {
        return clientResult.rows[0].Id;
      }

      this.logger.log(
        `Client avec EBP ID ${ebpClientId} non trouvé, tentative de synchronisation...`,
      );
      const newClientIdNumber =
        await this.clientSync.syncClientByCustomerId(ebpClientId);

      if (newClientIdNumber === null) {
        throw new Error(
          `Échec de synchronisation du client avec EBP ID ${ebpClientId}`,
        );
      }

      return newClientIdNumber.toString();
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération/synchronisation de l'ID interne du client pour EBP ID: ${ebpClientId}`,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Insère un projet dans la base App
   */
  async insertProjectIntoApp(projectApp: ProjectAPP): Promise<string | null> {
    const customerEbpId = projectApp.client_id;

    try {
      // Obtenir un client depuis le pool de connexions de destination
      const client = await PgClient2.getClient();

      try {
        await client.query('BEGIN');

        // Rechercher l'ID numérique correspondant au client dans la table clients
        let appClientId: number | null = null;
        const clientQuery = `
          SELECT id FROM clients WHERE customer_id = $1
        `;

        const clientResult: QueryResult<{
          id: number;
        }> = await client.query<{
          id: number;
        }>(clientQuery, [
          customerEbpId as any, // Cast to any to resolve potential type mismatch with query params
        ]);

        if (clientResult.rows && clientResult.rows.length > 0) {
          // Client trouvé, utiliser son ID numérique
          appClientId = Number(clientResult.rows[0]?.id);
          this.logger.log(
            `Client trouvé avec ID: ${appClientId} pour customerEbpId: ${customerEbpId}`,
          );
        } else {
          this.logger.warn(
            `Client avec customerEbpId ${customerEbpId} non trouvé dans la table clients. Impossible d'associer un client valide.`,
          );
          // appClientId reste null
        }

        // Si clientId est toujours null ici (client existant non trouvé),
        // cela signifie que le client n'a pas pu être associé. Annuler la transaction et ignorer le projet.
        if (appClientId === null) {
          this.logger.warn(
            `Impossible de trouver un client pour le projet EBP ${projectApp.reference}. Le projet sera ignoré.`,
          );
          await client.query('ROLLBACK'); // Annuler la transaction pour ce projet
          return null; // Ne pas insérer le projet
        }

        let projectAddressId: number | null = null;
        const ebpConstructionSiteData =
          projectApp.constructionSite as ConstructionsiteInterface;

        const siteAddressData = this.getConstructionSiteAddressData(
          ebpConstructionSiteData,
        );

        if (siteAddressData) {
          const addressDataForUpsert: CreateClientWithAddressDto['address'] = {
            street_name: siteAddressData.Address1,
            additional_address: siteAddressData.Address2,
            city: siteAddressData.City,
            zip_code: siteAddressData.ZipCode,
            country: siteAddressData.CountryIsoCode,
            street_number: null, // Assuming street_number is not available in ConstructionSite address
          };

          try {
            projectAddressId = await this.ebpClient.upsertAddress(
              addressDataForUpsert,
              client,
            );
            if (projectAddressId === null) {
              this.logger.warn(
                `Impossible de déterminer l'ID de l'adresse (table addresses locale) pour le projet ${projectApp.reference}.`,
              );
            } else {
              this.logger.debug(
                `Adresse locale upserted pour projet ${projectApp.reference}, ID local: ${projectAddressId}`,
              );
            }
          } catch (error) {
            this.logger.error(`Erreur lors de l'upsert d'adresse: ${error}`);
          }
        } else {
          this.logger.warn(
            `Pas de données d'adresse (Address1) trouvées pour le projet ${projectApp.reference}.`,
          );
        }

        // Parameters for the SQL queries (excluding the reference for the WHERE clause initially)
        const projectValues = [
          projectApp.name, // $2 (for UPDATE) or $1 (for INSERT)
          projectApp.description, // $3 (for UPDATE) or $2 (for INSERT)
          appClientId, // $4 (for UPDATE) or $3 (for INSERT)
          projectAddressId, // $5 (for UPDATE) or $4 (for INSERT)
          projectApp.status || 'prospect', // $6 (for UPDATE) or $5 (for INSERT)
          projectApp.start_date ? new Date(projectApp.start_date) : null, // $7 (for UPDATE) or $6 (for INSERT)
          projectApp.end_date ? new Date(projectApp.end_date) : null, // $8 (for UPDATE) or $7 (for INSERT)
          projectApp.estimated_duration, // $9 (for UPDATE) or $8 (for INSERT)
          projectApp.budget, // $10 (for UPDATE) or $9 (for INSERT)
          projectApp.actual_cost, // $11 (for UPDATE) or $10 (for INSERT)
          projectApp.margin, // $12 (for UPDATE) or $11 (for INSERT)
          2, // $13 (for UPDATE) or $12 (for INSERT) (priority)
          projectApp.notes || projectApp.description, // $14 (for UPDATE) or $13 (for INSERT)
          projectApp.project_id, // $15 (for UPDATE) or $14 (for INSERT) (stocke l'ID EBP original si différent de reference)
        ];

        // D'abord, vérifier si le projet existe déjà en utilisant pgDestinationClient
        const checkProjectQuery = `
          SELECT "id" FROM "projects"
          WHERE "reference" = $1
        `;

        const checkResult: QueryResult<{
          id: number;
        }> = await client.query<{
          id: number;
        }>(checkProjectQuery, [projectApp.reference]);

        let projectResult: QueryResult<{ reference: string }>;

        if (checkResult.rows && checkResult.rows.length > 0) {
          // Le projet existe déjà, faire un UPDATE
          const updateProjectQuery = `
            UPDATE "projects" SET
              "name" = $2,
              "description" = $3,
              "client_id" = $4,
              "address_id" = $5,
              "status" = $6,
              "start_date" = $7,
              "end_date" = $8,
              "estimated_duration" = $9,
              "budget" = $10,
              "actual_cost" = $11,
              "margin" = $12,
              "priority" = $13,
              "notes" = $14,
              "project_id" = $15,
              "updated_at" = NOW()
            WHERE "reference" = $1
            RETURNING "reference"
          `;

          // Add reference to the beginning of the values array for the UPDATE query
          const updateValues = [projectApp.reference, ...projectValues];

          projectResult = await client.query<{ reference: string }>(
            updateProjectQuery,
            updateValues,
          );
        } else {
          // Le projet n'existe pas, faire un INSERT
          const insertProjectQuery = `
            INSERT INTO "projects" (
              "reference", "name", "description", "client_id", 
              "address_id", "status", "start_date", "end_date", "estimated_duration", 
              "budget", "actual_cost", "margin", "priority", "notes", "project_id",
               "created_at", "updated_at"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
            RETURNING "reference"
          `;

          // Add reference to the beginning of the values array for the INSERT query
          const insertValues = [projectApp.reference, ...projectValues];

          projectResult = await client.query<{ reference: string }>(
            insertProjectQuery,
            insertValues,
          );
        }

        if (
          !projectResult.rows ||
          projectResult.rows.length === 0 ||
          !projectResult.rows[0]?.reference
        ) {
          throw new Error(
            'Résultat de requête de projet invalide ou référence manquante',
          );
        }

        await client.query('COMMIT');
        return String(projectResult.rows[0]?.reference);
      } catch (error) {
        await client.query('ROLLBACK');
        this.logger.error(
          `Erreur lors de l'insertion/mise à jour du projet: ${projectApp.reference}`,
          error,
        );
        // Log de l'erreur détaillée si possible
        if (error instanceof Error) {
          this.logger.error(
            `Détails de l'erreur: ${error.message}`,
            error.stack,
          );
        } else {
          this.logger.error(`Détails de l'erreur: ${String(error)}`);
        }
        throw error; // Rethrow the error after logging
      } finally {
        // Libérer le client après utilisation
        if (client && typeof client.release === 'function') {
          client.release();
        }
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'obtention du client de la base de données: ${projectApp.reference}`,
        error,
      );
      // Log de l'erreur détaillée si possible
      if (error instanceof Error) {
        this.logger.error(`Détails de l'erreur: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Détails de l'erreur: ${String(error)}`);
      }
      throw error; // Rethrow the error after logging
    }
  }

  /**
   * Fonction utilitaire pour extraire des données d'adresse d'un constructionSite
   */
  private getConstructionSiteAddressData(
    ebpConstructionSiteData: ConstructionsiteInterface,
  ) {
    if (!ebpConstructionSiteData) {
      return null;
    }

    // On vérifie si les données d'adresse nécessaires sont présentes
    if (
      !ebpConstructionSiteData.ConstructionSiteAddress_Address1 &&
      !ebpConstructionSiteData.ConstructionSiteAddress_ZipCode &&
      !ebpConstructionSiteData.ConstructionSiteAddress_City
    ) {
      return null;
    }

    return {
      Address1: ebpConstructionSiteData.ConstructionSiteAddress_Address1 || '',
      Address2: ebpConstructionSiteData.ConstructionSiteAddress_Address2 || '',
      ZipCode: ebpConstructionSiteData.ConstructionSiteAddress_ZipCode || '',
      City: ebpConstructionSiteData.ConstructionSiteAddress_City || '',
      CountryIsoCode:
        ebpConstructionSiteData.ConstructionSiteAddress_CountryIsoCode || '',
      Description:
        ebpConstructionSiteData.ConstructionSiteAddress_Description || '',
    };
  }
}
