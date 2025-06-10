import { Injectable, Logger } from '@nestjs/common';
import { QueryResult, QueryResultRow } from 'pg';
import { executeQuery as executeEbpQuery } from '../clients/PgClient';

@Injectable()
export class EbpQueryService {
  private readonly logger = new Logger(EbpQueryService.name);

  constructor() {
    this.logger.log('Service de requêtes EBP (source) initialisé');
  }

  /**
   * Exécute une requête SQL sur la base EBP source et renvoie le résultat
   * @param query Requête SQL à exécuter
   * @param params Paramètres de la requête
   * @returns Résultat de la requête
   */
  async executeQuery<T extends QueryResultRow = any>(
    query: string,
    params: any[] = [],
  ): Promise<QueryResult<T>> {
    try {
      // Utilise executeQuery du client EBP qui retourne directement les rows
      const rows = await executeEbpQuery(query, params);
      
      // Formater pour correspondre à l'interface QueryResult
      return {
        rows: rows as T[],
        rowCount: rows.length,
        command: query.trim().split(' ')[0].toUpperCase(),
        oid: 0,
        fields: [],
      } as QueryResult<T>;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'exécution de la requête EBP: ${query}`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  /**
   * Exécute une requête SQL sur la base EBP et renvoie le premier résultat
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