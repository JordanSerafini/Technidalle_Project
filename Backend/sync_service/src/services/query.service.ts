import { Injectable, Logger } from '@nestjs/common';
import { QueryResult, QueryResultRow } from 'pg';
import destinationPgClient from '../clients/pgClient_2';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor() {
    this.logger.log('Service de requêtes PostgreSQL initialisé');
  }

  /**
   * Exécute une requête SQL et renvoie le résultat
   * @param query Requête SQL à exécuter
   * @param params Paramètres de la requête
   * @returns Résultat de la requête
   */
  async executeQuery<T extends QueryResultRow = any>(
    query: string,
    params: any[] = [],
  ): Promise<QueryResult<T>> {
    try {
      return await destinationPgClient.query(query, params);
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'exécution de la requête: ${query}`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  /**
   * Exécute une requête SQL et renvoie le premier résultat
   * @param query Requête SQL à exécuter
   * @param params Paramètres de la requête
   * @returns Premier résultat de la requête ou null
   */
  async executeQuerySingle<T extends QueryResultRow = any>(
    query: string,
    params: any[] = [],
  ): Promise<T | null> {
    const result = await this.executeQuery<T>(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
