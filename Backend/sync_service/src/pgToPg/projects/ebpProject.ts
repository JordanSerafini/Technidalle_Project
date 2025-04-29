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

export default class EBPProject {
  private readonly logger = new Logger(EBPProject.name);
  private ebpClient: EBPclient;

  constructor() {
    this.ebpClient = new EBPclient();
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
   * Vérifie si un client existe dans la base App et récupère son ID interne
   * S'il n'existe pas, le synchronise depuis EBP.
   * @param ebpClientId ID du client dans la base EBP (CustomerId)
   * @returns ID interne du client dans la base App
   */
  async getAppClientIdFromEbpId(ebpClientId: string): Promise<string> {
    try {
      const clientQuery = `
        SELECT id FROM clients WHERE customerId = $1
      `;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const clientResult = (await pgClientDestination.query(clientQuery, [
        ebpClientId,
      ])) as QueryResult<{ id: string }>; // Supposons que l'ID client est une string

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!clientResult?.rows) {
        throw new Error(
          'Résultat de requête invalide pour la recherche de client par customerId',
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (clientResult.rows.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const id = clientResult.rows[0].id;
        if (typeof id !== 'string') {
          throw new Error(
            `ID client interne invalide récupéré pour EBP ID ${ebpClientId}: ${id}`,
          );
        }
        return id;
      }

      this.logger.log(
        `Client EBP ${ebpClientId} non trouvé, démarrage synchronisation`,
      );
      const newClientIdNumber =
        await this.ebpClient.syncClientByCustomerId(ebpClientId);
      return newClientIdNumber.toString();
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération/synchronisation de l'ID interne du client pour EBP ID: ${ebpClientId}`,
        error,
      );
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

      const appClientId = await this.getAppClientIdFromEbpId(customerEbpId);

      let projectAddressId = projectApp.address_id;
      if (
        !projectAddressId &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        projectApp.constructionSite?.ConstructionSiteAddress_Address1
      ) {
        const addressQuery = `
          INSERT INTO addresses (
            street_name, additional_address, city, zip_code, country, street_number
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `;
        const addressValues = [
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          projectApp.constructionSite.ConstructionSiteAddress_Address1,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          projectApp.constructionSite.ConstructionSiteAddress_Address2 || null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          projectApp.constructionSite.ConstructionSiteAddress_City,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          projectApp.constructionSite.ConstructionSiteAddress_ZipCode?.padStart(
            5,
            '0',
          ) || '00000',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          projectApp.constructionSite.ConstructionSiteAddress_CountryIsoCode ||
            null,
          '',
        ];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const addressResult = (await client.query(
          addressQuery,
          addressValues,
        )) as QueryResult<{ id: number }>; // L'ID d'adresse est un nombre (SERIAL)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!addressResult?.rows?.[0]?.id) {
          throw new Error(
            "Résultat de requête d'adresse invalide ou ID manquant",
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        projectAddressId = addressResult.rows[0].id;
      }

      // Retrait de ebp_id de la requête
      const projectQuery = `
        INSERT INTO projects (
          reference, name, description, client_id, address_id,
          start_date, end_date, budget, actual_cost, margin, notes,
          projectid
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
          projectid = EXCLUDED.projectid
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
        projectApp.constructionSite?.Id // Ajout de l'ID EBP comme projectid
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
