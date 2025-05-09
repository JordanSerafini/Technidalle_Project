import { Logger } from '@nestjs/common';
import { ProjectEBP } from '../../interfaces/projects/projectEBP';
import {
  ProjectAPP,
  ProjectMapper,
} from '../../interfaces/projects/projectAPP';
import EBPclient from '../clients/ebpClient';
import pgClientDestination from '../../clients/pgClient_2';
import { ConstructionsiteInterface } from '../../interfaces/projects/constructionSite';
import { QueryService } from '../../services/query.service';
import { ClientSyncService } from '../../services/client-sync.service';
import { CreateClientWithAddressDto } from '../../interfaces/clients/clientApp';

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

      const referenceDocsMap = new Map<string, any>();
      referenceDocuments.forEach((doc) => {
        if (doc?.ConstructionSiteId) {
          referenceDocsMap.set(doc.ConstructionSiteId, doc);
        }
      });

      return constructionSites.map((site) => ({
        constructionSite: site,
        constructionSiteReferenceDocument: site.Id
          ? referenceDocsMap.get(site.Id)
          : undefined,
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
  async insertProjectIntoApp(projectApp: ProjectAPP): Promise<string> {
    const customerEbpId = projectApp.client_id;

    try {
      // Démarrer la transaction avec pgClientDestination au lieu de this.queryService
      const pgDestinationClient = await pgClientDestination.getClient();
      
      try {
        await pgDestinationClient.query('BEGIN');

        // Rechercher l'ID numérique correspondant au client dans la table clients
        let appClientId: number | null = null;
        const clientQuery = `
          SELECT id FROM clients WHERE customer_id = $1
        `;
        
        const clientResult = await pgDestinationClient.query(clientQuery, [customerEbpId]);
        
        if (clientResult.rows && clientResult.rows.length > 0) {
          // Client trouvé, utiliser son ID numérique
          appClientId = clientResult.rows[0].id;
          this.logger.log(`Client trouvé avec ID: ${appClientId} pour customerEbpId: ${customerEbpId}`);
        } else {
          // Si client non trouvé, on peut insérer un client temporaire
          this.logger.warn(`Client avec customerEbpId ${customerEbpId} non trouvé dans la table clients`);
          
          // Option: insérer un client temporaire
          const tempClientQuery = `
            INSERT INTO clients (customer_id, firstname, lastname, email)
            VALUES ($1, 'Client', $2, $3)
            RETURNING id
          `;
          
          const tempEmail = `${customerEbpId.toLowerCase()}@temp.com`;
          const tempClientResult = await pgDestinationClient.query(
            tempClientQuery, 
            [customerEbpId, customerEbpId, tempEmail]
          ).catch(err => {
            this.logger.error(`Erreur lors de l'insertion du client temporaire: ${err.message}`);
            return { rows: [] };
          });
          
          if (tempClientResult.rows && tempClientResult.rows.length > 0) {
            appClientId = tempClientResult.rows[0].id;
            this.logger.log(`Client temporaire créé avec ID: ${appClientId}`);
          } else {
            // Si impossible de créer un client temporaire, utiliser une valeur par défaut
            appClientId = 1; // ID client par défaut
            this.logger.warn(`Utilisation de l'ID client par défaut: ${appClientId}`);
          }
        }

        let projectAddressId: number | null = null;
        const ebpConstructionSiteData =
          projectApp.constructionSite as ConstructionsiteInterface;

        const siteAddressData = this.getConstructionSiteAddressData(
          ebpConstructionSiteData,
        );

        if (siteAddressData) {
          const addressDataForUpsert: CreateClientWithAddressDto['address'] = {
            street_name: siteAddressData.address1,
            additional_address: siteAddressData.address2,
            city: siteAddressData.city,
            zip_code: siteAddressData.zipCode,
            country: siteAddressData.country,
            street_number: null,
          };

          try {
            projectAddressId = await this.ebpClient.upsertAddress(
              addressDataForUpsert,
              pgDestinationClient,
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

        const projectValues = [
          projectApp.reference, // project_id
          projectApp.reference, // reference
          projectApp.name, // name
          projectApp.description, // description
          appClientId, // client_id (maintenant un ID numérique)
          projectAddressId, // address_id
          'prospect', // status
          projectApp.start_date ? new Date(projectApp.start_date) : null, // start_date
          projectApp.end_date ? new Date(projectApp.end_date) : null, // end_date
          null, // estimated_duration
          projectApp.budget, // budget
          projectApp.actual_cost, // actual_cost
          projectApp.margin, // margin
          2, // priority - valeur par défaut
          projectApp.notes || projectApp.description, // notes
        ];

        // D'abord, vérifier si le projet existe déjà en utilisant pgDestinationClient
        const checkProjectQuery = `
          SELECT "id" FROM "projects"
          WHERE "reference" = $1
        `;

        const checkResult = await pgDestinationClient.query(checkProjectQuery, [
          projectApp.reference,
        ]);

        let projectResult;

        if (checkResult.rows && checkResult.rows.length > 0) {
          // Le projet existe déjà, faire un UPDATE
          const updateProjectQuery = `
            UPDATE "projects" SET
              "project_id" = $1,
              "name" = $3,
              "description" = $4,
              "client_id" = $5,
              "address_id" = $6,
              "status" = $7,
              "start_date" = $8,
              "end_date" = $9,
              "estimated_duration" = $10,
              "budget" = $11,
              "actual_cost" = $12,
              "margin" = $13,
              "priority" = $14,
              "notes" = $15,
              "updated_at" = NOW()
            WHERE "reference" = $2
            RETURNING "reference"
          `;

          projectResult = await pgDestinationClient.query(
            updateProjectQuery,
            projectValues,
          );
        } else {
          // Le projet n'existe pas, faire un INSERT
          const insertProjectQuery = `
            INSERT INTO "projects" (
              "project_id", "reference", "name", "description", "client_id", 
              "address_id", "status", "start_date", "end_date", "estimated_duration", 
              "budget", "actual_cost", "margin", "priority", "notes"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING "reference"
          `;

          projectResult = await pgDestinationClient.query(
            insertProjectQuery,
            projectValues,
          );
        }

        if (!projectResult.rows || !projectResult.rows[0]?.reference) {
          throw new Error(
            'Résultat de requête de projet invalide ou référence manquante',
          );
        }

        await pgDestinationClient.query('COMMIT');
        return projectResult.rows[0].reference;
      } catch (error) {
        await pgDestinationClient.query('ROLLBACK');
        this.logger.error(
          `Erreur lors de l'insertion du projet: ${projectApp.reference}`,
          error,
        );
        throw error;
      } finally {
        // Libérer le client après utilisation
        pgDestinationClient.release();
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'insertion du projet: ${projectApp.reference}`,
        error,
      );
      throw error;
    }
  }

  // Fonction utilitaire pour extraire des données d'adresse d'un constructionSite
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
      address1: ebpConstructionSiteData.ConstructionSiteAddress_Address1 || '',
      address2: ebpConstructionSiteData.ConstructionSiteAddress_Address2 || '',
      zipCode: ebpConstructionSiteData.ConstructionSiteAddress_ZipCode || '',
      city: ebpConstructionSiteData.ConstructionSiteAddress_City || '',
      country:
        ebpConstructionSiteData.ConstructionSiteAddress_CountryIsoCode || '',
      description:
        ebpConstructionSiteData.ConstructionSiteAddress_Description || '',
    };
  }
}
