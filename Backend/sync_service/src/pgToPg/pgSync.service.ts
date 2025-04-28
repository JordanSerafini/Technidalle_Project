import { Injectable, Logger } from '@nestjs/common';
import { Customer as ClientEBP } from '../interfaces/clients/clientEBP';
import { CreateClientWithAddressDto } from '../interfaces/clients/clientApp';
import EBPclient from './clients/ebpClient';
import { Item as ItemEBP } from '../interfaces/items/itemEBP';
import { ItemAPP } from '../interfaces/items/itemAPP';

@Injectable()
export class PgSyncService {
  private readonly logger = new Logger(PgSyncService.name);
  private ebpClient = new EBPclient();

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
    errors?: any[];
  }> {
    try {
      this.logger.log('Démarrage de la synchronisation des clients');

      // Récupérer tous les clients depuis EBP
      const clientsEBP = await this.ebpClient.getAllClientsFromEBP();
      this.logger.log(`${clientsEBP.length} clients récupérés depuis EBP`);

      // Convertir les clients au format App
      const clientsApp = this.convertMultipleEBPClientsToAppClients(clientsEBP);

      // Insérer les clients dans la base App
      const errors: any[] = [];
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
          errors.push({ client: clientApp.email, error: error.message });
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
      return {
        success: false,
        count: 0,
        errors: [error.message],
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
    errors?: any[];
  }> {
    try {
      this.logger.log('Démarrage de la synchronisation des articles');

      // Récupérer tous les articles depuis EBP
      const itemsEBP = await this.ebpClient.getAllItemsFromEBP();
      this.logger.log(`${itemsEBP.length} articles récupérés depuis EBP`);

      // Convertir les articles au format App
      const itemsApp = this.convertMultipleEBPItemsToAppItems(itemsEBP);

      // Insérer les articles dans la base App
      const errors: any[] = [];
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
          errors.push({ item: itemApp.reference, error: error.message });
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
      return {
        success: false,
        count: 0,
        errors: [error.message],
      };
    }
  }
}
