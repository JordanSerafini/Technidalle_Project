import { Logger } from '@nestjs/common';
import { ProjectEBP } from '../../interfaces/projects/projectEBP';
import {
  ProjectAPP,
  ProjectMapper,
} from '../../interfaces/projects/projectAPP';
import EBPclient from '../clients/ebpClient';
import pgClientDestination from '../../clients/pgClient_2';
import { QueryResult } from 'pg';
import {
  ConstructionsiteInterface,
  ConstructionsitereferencedocumentInterface,
} from '../../interfaces/projects/constructionSite';
import { Pool, PoolClient } from 'pg';
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
        (await this.ebpClient.getAllConstructionSiteReferenceDocumentsFromEBP()) as ConstructionsitereferencedocumentInterface[];
      this.logger.log(
        `Récupéré ${referenceDocuments.length} documents de référence`,
      );

      const referenceDocsMap = new Map<
        string,
        ConstructionsitereferencedocumentInterface
      >();
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
  private async getAppClientIdFromEbpId(
    dbClient: Pool | PoolClient,
    ebpClientId: string,
  ): Promise<string> {
    try {
      // Vérifier d'abord si nous avons déjà le client dans la base de données de l'application
      const clientQuery = `
        SELECT id FROM clients 
        WHERE customer_id = $1
      `;

      // Exécuter la requête pour obtenir l'ID interne du client
      const clientResult = await this.queryService.executeQuery<{ id: number }>(
        dbClient,
        clientQuery,
        [ebpClientId],
      );

      if (clientResult.rowCount > 0 && clientResult.rows[0]?.id) {
        // Convertir l'ID numérique en chaîne de caractères pour la cohérence
        return clientResult.rows[0].id.toString();
      }

      // Si le client n'existe pas encore, on le synchronise
      this.logger.log(
        `Client avec EBP ID ${ebpClientId} non trouvé, tentative de synchronisation...`,
      );
      const newClientIdNumber = await this.clientSync.syncClientByCustomerId(
        dbClient,
        ebpClientId,
      );

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
      // Relancer l'erreur pour que l'appelant (insertProjectIntoApp) sache qu'il y a eu un problème
      throw error;
    }
  }

  /**
   * Insère un projet dans la base App
   */
  async insertProjectIntoApp(projectApp: ProjectAPP): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client = await pgClientDestination.getClient();
    if (!client) {
      throw new Error("Impossible d'obtenir un client de base de données");
    }

    const customerEbpId = projectApp.client_id; // Gardons l'ID EBP client au cas où

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await client.query('BEGIN');

      const appClientId = await this.getAppClientIdFromEbpId(
        client,
        customerEbpId,
      );

      let projectAddressId: number | null = null;
      // Vérifier si les données d'adresse du site existent
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const siteAddress1 = projectApp.constructionSite?.ConstructionSiteAddress_Address1;

      if (siteAddress1) { // On ne tente l'upsert que si au moins l'adresse 1 existe
        // Créer un objet d'adresse compatible avec upsertAddress
        // Assurer que les champs requis sont des string (même vides), et non undefined
        const addressDataForUpsert: CreateClientWithAddressDto['address'] = {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          street_name: String(projectApp.constructionSite?.ConstructionSiteAddress_Address1 || ''),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          additional_address: String(projectApp.constructionSite?.ConstructionSiteAddress_Address2 || ''),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          city: String(projectApp.constructionSite?.ConstructionSiteAddress_City || ''),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          zip_code: String(projectApp.constructionSite?.ConstructionSiteAddress_ZipCode || ''),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          country: String(projectApp.constructionSite?.ConstructionSiteAddress_CountryIsoCode || 'France'), // Default à France si null/undefined
          street_number: null, // Laisser upsertAddress gérer l'extraction, passer null explicitement
        };

        // Appeler la fonction upsertAddress centralisée
        projectAddressId = await this.ebpClient.upsertAddress(addressDataForUpsert, client);

        if (projectAddressId === null) {
          this.logger.warn(
            `Impossible de déterminer l'ID de l'adresse pour le projet ${projectApp.reference}, insertion du projet avec address_id = NULL.`,
          );
        } else {
          this.logger.debug(`Adresse upserted pour projet ${projectApp.reference}, ID: ${projectAddressId}`);
        }
      } else {
        this.logger.warn(`Pas de données d'adresse (Address1) trouvées pour le projet ${projectApp.reference}, address_id sera NULL.`);
      }

      // Vérification et attribution de l'ID du site de construction
      let constructionSiteId = null;
      if (
        projectApp.constructionSite &&
        typeof projectApp.constructionSite === 'object' &&
        'Id' in projectApp.constructionSite
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        constructionSiteId = projectApp.constructionSite.Id;
      }

      const projectQuery = `
        INSERT INTO projects (
          reference, name, description, client_id, address_id,
          start_date, end_date, budget, actual_cost, margin, notes,
          project_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (reference)
        DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          client_id = EXCLUDED.client_id,
          address_id = EXCLUDED.address_id,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          budget = EXCLUDED.budget,
          actual_cost = EXCLUDED.actual_cost,
          margin = EXCLUDED.margin,
          notes = EXCLUDED.notes,
          project_id = EXCLUDED.project_id
        RETURNING reference
      `;

      const projectValues = [
        projectApp.reference,
        projectApp.name,
        projectApp.description,
        appClientId,
        projectAddressId,
        projectApp.start_date,
        projectApp.end_date,
        projectApp.budget,
        projectApp.actual_cost,
        projectApp.margin,
        projectApp.notes,
        constructionSiteId, // Utilisation de la variable sécurisée
      ];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const projectResult = (await client.query(
        projectQuery,
        projectValues,
      )) as QueryResult<{ reference: string }>;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!projectResult?.rows?.[0]?.reference) {
        throw new Error(
          'Résultat de requête de projet invalide ou référence manquante',
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await client.query('COMMIT');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return projectResult.rows[0].reference;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await client.query('ROLLBACK');
      this.logger.error(
        `Erreur lors de l'insertion du projet: ${projectApp.reference}`,
        error,
      );
      throw error;
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      client.release();
    }
  }
}
