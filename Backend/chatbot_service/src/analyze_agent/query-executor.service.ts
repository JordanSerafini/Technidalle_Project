import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { clientsQueries } from '../elasticsearch/queries/clients.query';
import { vehiclesQueries } from '../elasticsearch/queries/vehicles.query';
import { tasksQueries } from '../elasticsearch/queries/tasks.query';
import { staffQueries } from '../elasticsearch/queries/staff.query';
import { projectsQueries } from '../elasticsearch/queries/projects.query';
import { planningQueries } from '../elasticsearch/queries/planning.query';
import { materialsQueries } from '../elasticsearch/queries/materials.query';
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
}

// Interface pour le résultat de l'exécution d'une requête
export interface QueryExecutionResult {
  data: unknown;
  query_id: string;
  description: string;
  response_format: string;
}

@Injectable()
export class QueryExecutorService {
  private readonly logger = new Logger(QueryExecutorService.name);
  private readonly queryMap: Record<string, PredefinedQuery>;

  constructor(private readonly prismaService: PrismaService) {
    // Combiner toutes les requêtes dans une seule map
    this.queryMap = {
      ...clientsQueries,
      ...vehiclesQueries,
      ...tasksQueries,
      ...staffQueries,
      ...projectsQueries,
      ...planningQueries,
      ...materialsQueries,
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

      return {
        data: result,
        query_id: queryId,
        description: queryDetails.description,
        response_format: queryDetails.response_format || 'json',
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'exécution de la requête ${queryId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
