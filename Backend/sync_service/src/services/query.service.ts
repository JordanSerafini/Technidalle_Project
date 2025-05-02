import { Injectable, Logger } from '@nestjs/common';
import { Pool, PoolClient, QueryResult } from 'pg';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  /**
   * Exécute une requête SQL et renvoie le résultat
   * @param client Client de base de données (Pool ou PoolClient)
   * @param query Requête SQL à exécuter
   * @param params Paramètres de la requête
   * @returns Résultat de la requête
   */
  async executeQuery<T = any>(
    client: Pool | PoolClient,
    query: string,
    params: any[] = [],
  ): Promise<QueryResult<T>> {
    try {
      return await client.query(query, params);
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'exécution de la requête: ${query}`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }
}
