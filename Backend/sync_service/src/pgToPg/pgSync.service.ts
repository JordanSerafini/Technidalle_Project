import { Injectable, Logger } from '@nestjs/common';
import { Customer as ClientEBP } from '../interfaces/clients/clientEBP';
import { CreateClientWithAddressDto } from '../interfaces/clients/clientApp';
import EBPclient from './clients/ebpClient';
import { Item as ItemEBP } from '../interfaces/items/itemEBP';
import { ItemAPP } from '../interfaces/items/itemAPP';
import { ProjectEBP } from '../interfaces/projects/projectEBP';
import { ProjectAPP } from '../interfaces/projects/projectAPP';
import EBPProject from './projects/ebpProject';

// Interface pour typer les erreurs de synchronisation
export interface SyncErrorDetail {
  identifier: string | number | undefined; // Email client ou référence article
  error: string; // Message d'erreur
}

@Injectable()
export class PgSyncService {
  private readonly logger = new Logger(PgSyncService.name);
  private ebpClient = new EBPclient();
  private ebpProject = new EBPProject();

  constructor() {
    this.logger.log('PgSyncService initialized');
  }

  /**
   * Convertit un client EBP en client format application
   */
  convertEBPClientToAppClient(
    clientEBP: ClientEBP,
  ): CreateClientWithAddressDto {
    return this.ebpClient.convertToAppClient(clientEBP);
  }

  /**
   * Convertit une liste de clients EBP en clients format application
   */
  convertMultipleEBPClientsToAppClients(
    clientsEBP: ClientEBP[],
  ): CreateClientWithAddressDto[] {
    return this.ebpClient.convertMultipleToAppClient(clientsEBP);
  }

  /**
   * Synchronise tous les clients depuis EBP vers l'application
   * Récupère les clients depuis la base EBP, les convertit, et les insère dans la base App
   */
  async syncAllClients(): Promise<{
    success: boolean;
    count: number;
    errors?: SyncErrorDetail[];
  }> {
    try {
      this.logger.log('Démarrage de la synchronisation des clients');

      // Récupérer tous les clients depuis EBP
      const clientsEBP = await this.ebpClient.getAllClientsFromEBP();
      this.logger.log(`${clientsEBP.length} clients récupérés depuis EBP`);

      // Convertir les clients au format App
      const clientsApp = this.convertMultipleEBPClientsToAppClients(clientsEBP);

      // Insérer les clients dans la base App
      const errors: SyncErrorDetail[] = [];
      let successCount = 0;

      for (const clientApp of clientsApp) {
        try {
          const clientId = await this.ebpClient.insertClientIntoApp(clientApp);
          this.logger.log(`Client inséré avec l'ID: ${clientId}`);
          successCount++;
        } catch (error) {
          this.logger.error(
            `Erreur lors de l'insertion du client: ${clientApp.email}`,
            error,
          );
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Erreur inconnue lors de l'insertion du client";
          errors.push({ identifier: clientApp.email, error: errorMessage });
        }
      }

      this.logger.log(
        `Synchronisation terminée: ${successCount}/${clientsApp.length} clients synchronisés`,
      );

      return {
        success: true,
        count: successCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation des clients', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur inconnue lors de la synchronisation des clients';
      return {
        success: false,
        count: 0,
        errors: [{ identifier: 'global', error: errorMessage }],
      };
    }
  }

  /**
   * Convertit un article EBP en article format application
   */
  convertEBPItemToAppItem(itemEBP: ItemEBP): ItemAPP {
    return ItemAPP.fromEBP(itemEBP);
  }

  /**
   * Convertit une liste d'articles EBP en articles format application
   */
  convertMultipleEBPItemsToAppItems(itemsEBP: ItemEBP[]): ItemAPP[] {
    return itemsEBP.map((item) => this.convertEBPItemToAppItem(item));
  }

  /**
   * Synchronise tous les articles depuis EBP vers l'application
   * Récupère les articles depuis la base EBP, les convertit, et les insère dans la base App
   */
  async syncAllItems(): Promise<{
    success: boolean;
    count: number;
    errors?: SyncErrorDetail[];
  }> {
    try {
      this.logger.log('Démarrage de la synchronisation des articles');

      // Récupérer tous les articles depuis EBP
      const itemsEBP = await this.ebpClient.getAllItemsFromEBP();
      this.logger.log(`${itemsEBP.length} articles récupérés depuis EBP`);

      // Convertir les articles au format App
      const itemsApp = this.convertMultipleEBPItemsToAppItems(itemsEBP);

      // Insérer les articles dans la base App
      const errors: SyncErrorDetail[] = [];
      let successCount = 0;

      for (const itemApp of itemsApp) {
        try {
          const itemId = await this.ebpClient.insertItemIntoApp(itemApp);
          this.logger.log(`Article inséré avec l'ID: ${itemId}`);
          successCount++;
        } catch (error) {
          this.logger.error(
            `Erreur lors de l'insertion de l'article: ${itemApp.reference}`,
            error,
          );
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Erreur inconnue lors de l'insertion de l'article";
          errors.push({ identifier: itemApp.reference, error: errorMessage });
        }
      }

      this.logger.log(
        `Synchronisation terminée: ${successCount}/${itemsApp.length} articles synchronisés`,
      );

      return {
        success: true,
        count: successCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error(
        'Erreur lors de la synchronisation des articles',
        error,
      );
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur inconnue lors de la synchronisation des articles';
      return {
        success: false,
        count: 0,
        errors: [{ identifier: 'global', error: errorMessage }],
      };
    }
  }

  /**
   * Convertit un projet EBP en projet format application
   */
  convertEBPProjectToAppProject(projectEBP: ProjectEBP): ProjectAPP {
    return this.ebpProject.convertToAppProject(projectEBP);
  }

  /**
   * Convertit une liste de projets EBP en projets format application
   */
  convertMultipleEBPProjectsToAppProjects(
    projectsEBP: ProjectEBP[],
  ): ProjectAPP[] {
    return this.ebpProject.convertMultipleToAppProject(projectsEBP);
  }

  /**
   * Synchronise tous les projets depuis EBP vers l'application
   * Récupère les projets depuis la base EBP, les convertit, et les insère dans la base App
   */
  async syncAllProjects(): Promise<{
    success: boolean;
    count: number;
    errors?: SyncErrorDetail[];
  }> {
    try {
      this.logger.log('Démarrage de la synchronisation des projets');

      // Récupérer tous les projets depuis EBP
      const projectsEBP = await this.ebpProject.getAllProjectsFromEBP();
      this.logger.log(`${projectsEBP.length} projets récupérés depuis EBP`);

      // Convertir les projets au format App
      const projectsApp =
        this.convertMultipleEBPProjectsToAppProjects(projectsEBP);

      // Insérer les projets dans la base App
      const errors: SyncErrorDetail[] = [];
      let successCount = 0;

      for (const projectApp of projectsApp) {
        try {
          const projectId =
            await this.ebpProject.insertProjectIntoApp(projectApp);
          this.logger.log(`Projet inséré avec la référence: ${projectId}`);
          successCount++;
        } catch (error) {
          this.logger.error(
            `Erreur lors de l'insertion du projet: ${projectApp.reference}`,
            error,
          );
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Erreur inconnue lors de l'insertion du projet";
          errors.push({
            identifier: projectApp.reference,
            error: errorMessage,
          });
        }
      }

      this.logger.log(
        `Synchronisation terminée: ${successCount}/${projectsApp.length} projets synchronisés`,
      );

      return {
        success: true,
        count: successCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation des projets', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur inconnue lors de la synchronisation des projets';
      return {
        success: false,
        count: 0,
        errors: [{ identifier: 'global', error: errorMessage }],
      };
    }
  }
}
