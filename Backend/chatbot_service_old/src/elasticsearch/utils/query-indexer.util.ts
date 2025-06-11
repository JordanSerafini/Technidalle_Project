import { Client } from '@elastic/elasticsearch';
import { VectorStoreService } from '../../embedding/vector-store.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('QueryIndexerUtil');

/**
 * Vérifie si une requête existe déjà dans Elasticsearch et l'indexe si nécessaire
 * @param client Client Elasticsearch
 * @param vectorService Service de vectorisation
 * @param queryId Identifiant de la requête
 * @param queryDetails Détails de la requête
 * @returns True si la requête a été indexée, false si elle existait déjà
 */
export async function checkAndIndexQuery(
  client: Client,
  vectorService: VectorStoreService,
  queryId: string,
  queryDetails: any,
): Promise<boolean> {
  try {
    // Vérifier si la requête existe déjà
    const existingQuery = await client.search({
      index: 'predefined_queries',
      body: {
        query: {
          match: {
            query_id: queryId,
          },
        },
      },
    });

    // Si la requête n'existe pas, l'ajouter
    if (existingQuery.hits.hits.length === 0) {
      logger.log(`Indexation de la nouvelle requête: ${queryId}`);

      // Générer l'embedding pour les questions
      const questionsText = queryDetails.questions.join(' ');
      const questionsVector = await vectorService.generateEmbedding(
        questionsText,
      );

      // Déterminer la catégorie à partir du query_id
      const category = queryId.split('_')[0];

      // Indexer la requête
      await client.index({
        index: 'predefined_queries',
        body: {
          query_id: queryId,
          category,
          keywords: queryDetails.keywords || [],
          questions: queryDetails.questions || [],
          description: queryDetails.description || '',
          parameters: queryDetails.parameters || [],
          response_format: queryDetails.response_format || '',
          questions_vector: questionsVector,
          created_at: new Date(),
        },
      });

      logger.log(`Requête ${queryId} indexée avec succès`);
      return true;
    } else {
      logger.log(`La requête ${queryId} existe déjà, aucune action nécessaire`);
      return false;
    }
  } catch (error) {
    logger.error(
      `Erreur lors de la vérification/indexation de ${queryId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Vérifie et indexe un ensemble de requêtes
 * @param client Client Elasticsearch
 * @param vectorService Service de vectorisation
 * @param queries Ensemble de requêtes à vérifier et indexer
 * @returns Nombre de requêtes indexées
 */
export async function checkAndIndexQueries(
  client: Client,
  vectorService: VectorStoreService,
  queries: Record<string, any>,
): Promise<number> {
  let indexedCount = 0;
  
  for (const [queryId, queryDetails] of Object.entries(queries)) {
    try {
      const indexed = await checkAndIndexQuery(
        client,
        vectorService,
        queryId,
        queryDetails,
      );
      if (indexed) {
        indexedCount++;
      }
    } catch (error) {
      logger.error(`Erreur lors de l'indexation de ${queryId}:`, error);
      // Continuer avec les autres requêtes même si une échoue
    }
  }
  
  return indexedCount;
} 


/**
 * Fonction utilitaire pour indexer rapidement une ou plusieurs requêtes de n'importe quel module
 * @param queries Objet contenant les requêtes à indexer
 * @param apiBaseUrl URL de base de l'API (par défaut: http://localhost:3000)
 * @returns Promesse résolue avec le résultat de l'indexation
 */
export async function indexQueries(
    queries: Record<string, any>,
    apiBaseUrl: string = 'http://localhost:3000'
  ): Promise<any> {
    try {
      // Préparation des données pour l'API
      const payload = {
        queries: queries
      };
  
      // Appel à l'API pour indexer les requêtes
      const response = await fetch(`${apiBaseUrl}/elasticsearch/queries/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
  
      const result = await response.json();
      console.log(`Indexation réussie: ${result.count} requêtes indexées`);
      
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'indexation des requêtes:', error);
      throw error;
    }
  }
  
  /**
   * Fonction utilitaire pour indexer rapidement une seule requête
   * @param queryId Identifiant de la requête à indexer
   * @param queryDetails Détails de la requête à indexer
 * @param apiBaseUrl URL de base de l'API (par défaut: http://localhost:3000)
   * @returns Promesse résolue avec le résultat de l'indexation
   */
  export async function indexSingleQuery(
    queryId: string,
    queryDetails: any,
    apiBaseUrl: string = 'http://localhost:3000'
  ): Promise<any> {
    try {
      // Préparation des données pour l'API
      const payload = {
        queryId: queryId,
        queryDetails: queryDetails
      };
  
      // Appel à l'API pour indexer la requête
      const response = await fetch(`${apiBaseUrl}/elasticsearch/queries/single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
  
      const result = await response.json();
      console.log(`Indexation réussie de la requête ${queryId}`);
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de l'indexation de la requête ${queryId}:`, error);
      throw error;
    }
  }

  /**
   * Indexe toutes les requêtes de plusieurs modules en une seule opération
   * @param queryModules Tableau d'objets de requêtes de différents modules
 * @param apiBaseUrl URL de base de l'API (par défaut: http://localhost:3000)
   * @returns Promesse résolue avec le résultat de l'indexation
   */
  export async function indexMultipleModules(
    queryModules: Record<string, any>[],
    apiBaseUrl: string = 'http://localhost:3000'
  ): Promise<any> {
    try {
      // Fusionner tous les modules en un seul objet de requêtes
      const mergedQueries = {};
      
      for (const module of queryModules) {
        Object.assign(mergedQueries, module);
      }
      
      // Indexer toutes les requêtes fusionnées
      return await indexQueries(mergedQueries, apiBaseUrl);
    } catch (error) {
      console.error('Erreur lors de l\'indexation des modules:', error);
      throw error;
    }
  }
  