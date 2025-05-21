import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getClientsQueries } from '../elasticsearch/queries/clients.query';
import { getVehiclesQueries } from '../elasticsearch/queries/vehicles.query';
import { tasksQueries } from '../elasticsearch/queries/tasks.query';
import { staffQueries } from '../elasticsearch/queries/staff.query';
import { projectsQueries } from '../elasticsearch/queries/projects.query';
import { planningQueries } from '../elasticsearch/queries/planning.query';
import { getMaterialsQueries } from '../elasticsearch/queries/materials.query';
import { documentsQueries } from '../elasticsearch/queries/documents.query';

// Interface pour les paramètres de requête
interface QueryParameter {
  name: string;
  description: string;
  default?: unknown;
}

// Interface pour les requêtes prédéfinies
interface PredefinedQuery {
  keywords?: string[];
  questions: string[];
  description: string;
  prisma: (...args: unknown[]) => Promise<unknown>;
  parameters?: QueryParameter[];
  response_format?: string;
  cacheTTL?: number; // Nouveau champ pour le TTL du cache
}

// Interface pour le résultat de l'exécution d'une requête
export interface QueryExecutionResult {
  data: unknown;
  query_id: string;
  description: string;
  response_format: string;
  fromCache?: boolean; // Indiquer si le résultat vient du cache
}

@Injectable()
export class QueryExecutorService {
  private readonly logger = new Logger(QueryExecutorService.name);
  private readonly queryMap: Record<string, PredefinedQuery>;
  private readonly cache: Map<string, { data: any; timestamp: number }> =
    new Map();
  private readonly DEFAULT_CACHE_TTL = 1000 * 60 * 15; // 15 minutes par défaut

  constructor(private readonly prismaService: PrismaService) {
    // Combiner toutes les requêtes dans une seule map
    this.queryMap = {
      ...getClientsQueries(this.prismaService),
      ...getVehiclesQueries(this.prismaService),
      ...tasksQueries,
      ...staffQueries,
      ...projectsQueries,
      ...planningQueries,
      ...getMaterialsQueries(this.prismaService),
      ...documentsQueries,
    } as Record<string, PredefinedQuery>;
  }

  /**
   * Exécute une requête prédéfinie en utilisant son ID
   * @param queryId L'identifiant de la requête à exécuter
   * @param params Les paramètres à passer à la requête
   * @returns Les résultats de la requête Prisma
   */
  async executeQuery(
    queryId: string,
    params: Record<string, unknown> = {},
  ): Promise<QueryExecutionResult> {
    this.logger.log(
      `Exécution de la requête ${queryId} avec les paramètres: ${JSON.stringify(params)}`,
    );

    // Vérifier si la requête existe
    const queryDetails = this.queryMap[queryId];
    if (!queryDetails) {
      this.logger.error(`Requête ${queryId} non trouvée`);
      throw new NotFoundException(`Requête ${queryId} non trouvée`);
    }

    // Vérifier si la requête a une fonction Prisma
    if (!queryDetails.prisma || typeof queryDetails.prisma !== 'function') {
      this.logger.error(`Requête ${queryId} n'a pas de fonction Prisma valide`);
      throw new NotFoundException(
        `Requête ${queryId} n'a pas de fonction Prisma valide`,
      );
    }

    // Générer la clé de cache en combinant l'ID de la requête et les paramètres
    const cacheKey = this.generateCacheKey(queryId, params);

    // Vérifier si nous avons un résultat en cache valide
    const cachedResult = this.getCachedResult(
      cacheKey,
      queryDetails.cacheTTL || this.DEFAULT_CACHE_TTL,
    );
    if (cachedResult) {
      this.logger.log(`Résultat trouvé en cache pour la requête ${queryId}`);
      return {
        data: cachedResult,
        query_id: queryId,
        description: queryDetails.description,
        response_format: queryDetails.response_format || 'json',
        fromCache: true,
      };
    }

    try {
      // Extraire les paramètres de la définition de la requête
      const requiredParams = queryDetails.parameters || [];
      const paramValues: unknown[] = [];

      // Si la requête a des paramètres définis, les extraire des paramètres fournis
      if (requiredParams.length > 0) {
        for (const param of requiredParams) {
          const paramName = param.name;
          if (params[paramName] !== undefined) {
            paramValues.push(params[paramName]);
          } else {
            // Si un paramètre requis n'est pas fourni, utiliser une valeur par défaut ou lancer une erreur
            if (param.default !== undefined) {
              paramValues.push(param.default);
            } else {
              throw new Error(`Paramètre requis ${paramName} non fourni`);
            }
          }
        }
      }

      // Exécuter la fonction Prisma avec les paramètres
      this.logger.log(`Exécution de la fonction Prisma pour ${queryId}`);
      const result = await queryDetails.prisma(...paramValues);

      // Mettre en cache le résultat
      this.cacheResult(
        cacheKey,
        result,
        queryDetails.cacheTTL || this.DEFAULT_CACHE_TTL,
      );

      return {
        data: result,
        query_id: queryId,
        description: queryDetails.description,
        response_format: queryDetails.response_format || 'json',
        fromCache: false,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'exécution de la requête ${queryId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Génère une clé unique pour le cache basée sur l'ID de requête et les paramètres
   */
  private generateCacheKey(
    queryId: string,
    params: Record<string, unknown>,
  ): string {
    return `${queryId}:${JSON.stringify(params)}`;
  }

  /**
   * Récupère un résultat du cache s'il existe et n'a pas expiré
   */
  private getCachedResult(cacheKey: string, ttl: number): unknown | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // Vérifier si le cache a expiré
    const now = Date.now();
    if (now - cached.timestamp > ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  /**
   * Stocke un résultat dans le cache
   */
  private cacheResult(cacheKey: string, data: unknown, ttl: number): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Programmer la suppression du cache après le TTL
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, ttl);
  }

  /**
   * Invalide le cache pour une requête spécifique ou toutes les requêtes
   */
  invalidateCache(queryId?: string): void {
    if (queryId) {
      // Supprimer uniquement les entrées correspondant à queryId
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${queryId}:`)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach((key) => this.cache.delete(key));
      this.logger.log(`Cache invalidé pour la requête ${queryId}`);
    } else {
      // Supprimer tout le cache
      this.cache.clear();
      this.logger.log('Cache entièrement invalidé');
    }
  }
}
