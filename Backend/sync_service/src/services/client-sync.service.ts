import { Injectable, Logger } from '@nestjs/common';
import { QueryService } from './query.service';

interface ClientRow {
  id: number;
  // autres champs potentiels de la table clients...
}

@Injectable()
export class ClientSyncService {
  private readonly logger = new Logger(ClientSyncService.name);

  constructor(private readonly queryService: QueryService) {}

  /**
   * Synchronise un client en utilisant son ID EBP et renvoie son ID interne
   * @param ebpClientId Identifiant EBP du client
   * @returns ID interne du client ou null si la synchronisation échoue
   */
  async syncClientByCustomerId(ebpClientId: string): Promise<number | null> {
    try {
      this.logger.log(
        `Synchronisation du client avec l'ID EBP: ${ebpClientId}`,
      );

      // Vérifier d'abord si le client existe déjà
      const existingClientQuery = `
        SELECT id FROM clients WHERE customer_id = $1
      `;

      const result = await this.queryService.executeQuery<ClientRow>(
        existingClientQuery,
        [ebpClientId],
      );

      if (result.rows.length > 0) {
        return result.rows[0].id;
      }

      // Logique de synchronisation de client à implémenter selon les besoins
      // Pour l'instant, retourne null si le client n'existe pas
      this.logger.warn(
        `Client avec ID EBP ${ebpClientId} non trouvé et la synchronisation complète n'est pas implémentée`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la synchronisation du client ${ebpClientId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }
}
