import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { VectorStoreService } from '../embedding/vector-store.service';
import { getClientsQueries } from './queries/clients.query';
import { getVehiclesQueries } from './queries/vehicles.query';
import { tasksQueries } from './queries/tasks.query';
import { staffQueries } from './queries/staff.query';
import { projectsQueries } from './queries/projects.query';
import { planningQueries } from './queries/planning.query';
import { getMaterialsQueries } from './queries/materials.query';
import { documentsQueries } from './queries/documents.query';
import { PrismaService } from '../prisma/prisma.service';

// Interfaces pour le typage
interface ElasticsearchResponseHit {
  _id: string;
  _score: number;
  _source: Record<string, any>;
}

interface ElasticsearchResponse {
  hits: {
    hits: ElasticsearchResponseHit[];
  };
  items?: any[];
  errors?: boolean;
}

interface BulkResponse {
  errors?: boolean;
  items?: any[];
}

interface QueryDetails {
  keywords?: string[];
  questions: string[];
  description: string;
  parameters?: any[];
  response_format?: string;
  // On ignore les autres champs qui peuvent varier
  [key: string]: any;
}

@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly client: Client;
  private readonly indexName = 'questions';
  private readonly queriesIndexName = 'predefined_queries';

  // Instancier les queries avec PrismaService
  private readonly clientsQueries;
  private readonly materialsQueries;
  private readonly vehiclesQueries;

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly prismaService: PrismaService,
  ) {
    const options = {
      node: this.configService.get<string>(
        'ELASTICSEARCH_NODE',
        'http://localhost:9200',
      ),
      auth: {
        username: this.configService.get<string>(
          'ELASTICSEARCH_USERNAME',
          'elastic',
        ),
        password: this.configService.get<string>(
          'ELASTICSEARCH_PASSWORD',
          'elastic',
        ),
      },
      // Ignorer les erreurs TLS
      tls: {
        rejectUnauthorized: false,
      },
    };

    // Créer le client avec les options de base
    this.client = new Client(options) as Client;

    // Initialiser les queries avec PrismaService
    this.clientsQueries = getClientsQueries(this.prismaService);
    this.materialsQueries = getMaterialsQueries(this.prismaService);
    this.vehiclesQueries = getVehiclesQueries(this.prismaService);

    // Pas besoin de modifier les en-têtes, utiliser version Client simple
    this.initializeIndex();
    this.initializeQueriesIndex();
  }

  private async initializeIndex(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!indexExists) {
        await this.client.indices.create({
          index: this.indexName,
          mappings: {
            properties: {
              question: { type: 'text' },
              question_vector: {
                type: 'dense_vector',
                dims: 3072,
                index: true,
                similarity: 'cosine',
              },
              answer: { type: 'text' },
              category: { type: 'keyword' },
              source: { type: 'keyword' },
              created_at: { type: 'date' },
            },
          },
        });
        this.logger.log(`Index '${this.indexName}' créé avec succès`);
      }
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de l'initialisation de l'index: ${error.message}`,
      );
    }
  }

  private async initializeQueriesIndex(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.queriesIndexName,
      });

      if (!indexExists) {
        await this.client.indices.create({
          index: this.queriesIndexName,
          mappings: {
            properties: {
              query_id: { type: 'keyword' },
              category: { type: 'keyword' },
              keywords: { type: 'text' },
              questions: { type: 'text' },
              description: { type: 'text' },
              parameters: { type: 'nested' },
              response_format: { type: 'keyword' },
              questions_vector: {
                type: 'dense_vector',
                dims: 3072,
                index: true,
                similarity: 'cosine',
              },
              created_at: { type: 'date' },
            },
          },
        });
        this.logger.log(`Index '${this.queriesIndexName}' créé avec succès`);
      }
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de l'initialisation de l'index des requêtes: ${error.message}`,
      );
    }
  }

  async indexQuestion(
    questionText: string,
    answer: string,
    category: string = 'general',
    source: string = 'user',
  ): Promise<string> {
    try {
      // Générer l'embedding pour la question
      const questionVector =
        await this.vectorStoreService.generateEmbedding(questionText);

      // Indexer la question et son embedding
      const response = (await this.client.index({
        index: this.indexName,
        body: {
          question: questionText,
          question_vector: questionVector,
          answer,
          category,
          source,
          created_at: new Date(),
        },
      })) as any;

      this.logger.log(`Question indexée avec succès: ${response._id}`);
      return response._id as string;
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de l'indexation de la question: ${error.message}`,
      );
      throw error;
    }
  }

  async findSimilarQuestions(
    questionText: string,
    limit: number = 5,
  ): Promise<any[]> {
    try {
      // Générer l'embedding pour la question
      const questionVector =
        await this.vectorStoreService.generateEmbedding(questionText);

      // Rechercher des questions similaires basées sur la similarité vectorielle
      const response = (await this.client.search({
        index: this.indexName,
        size: limit,
        query: {
          script_score: {
            query: { match_all: {} },
            script: {
              source:
                "cosineSimilarity(params.query_vector, 'question_vector') + 1.0",
              params: { query_vector: questionVector },
            },
          },
        },
      })) as ElasticsearchResponse;

      // Formater les résultats
      const results = response.hits.hits.map((hit) => ({
        id: hit._id,
        question: hit._source.question,
        answer: hit._source.answer,
        category: hit._source.category,
        source: hit._source.source,
        score: hit._score,
      }));

      return results;
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de la recherche de questions similaires: ${error.message}`,
      );
      throw error;
    }
  }

  async getQuestionById(id: string): Promise<any> {
    try {
      const response = (await this.client.get({
        index: this.indexName,
        id,
      })) as any;

      return {
        id: response._id,
        question: response._source.question,
        answer: response._source.answer,
        category: response._source.category,
        source: response._source.source,
        created_at: response._source.created_at,
      };
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de la récupération de la question: ${error.message}`,
      );
      throw error;
    }
  }

  async deleteQuestionById(id: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.indexName,
        id,
      });
      this.logger.log(`Question ${id} supprimée avec succès`);
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de la suppression de la question: ${error.message}`,
      );
      throw error;
    }
  }

  async bulkIndexQuestions(
    questions: Array<{
      question: string;
      answer: string;
      category?: string;
      source?: string;
    }>,
  ): Promise<void> {
    try {
      // Préparer les opérations pour l'indexation en masse
      const operations: any[] = [];

      for (const questionObj of questions) {
        const {
          question,
          answer,
          category = 'general',
          source = 'system',
        } = questionObj;

        // Générer l'embedding pour chaque question
        const questionVector =
          await this.vectorStoreService.generateEmbedding(question);

        // Ajouter les opérations d'indexation
        operations.push(
          { index: { _index: this.indexName } },
          {
            question,
            question_vector: questionVector,
            answer,
            category,
            source,
            created_at: new Date(),
          },
        );
      }

      // Exécuter l'opération d'indexation en masse
      if (operations.length > 0) {
        const response = (await this.client.bulk({
          body: operations,
          refresh: true,
        })) as BulkResponse;

        this.logger.log(
          `Indexation en masse réussie: ${response.items?.length || 0} questions traitées`,
        );

        if (response.errors) {
          this.logger.warn(
            `Certaines erreurs se sont produites lors de l'indexation en masse`,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de l'indexation en masse des questions: ${error.message}`,
      );
      throw error;
    }
  }

  async indexPredefinedQueries(): Promise<{ success: boolean; count: number }> {
    try {
      this.logger.log(`Démarrage de l'indexation des requêtes prédéfinies...`);

      // Récupérer toutes les requêtes prédéfinies
      const allQueries: Record<string, QueryDetails> = {
        ...this.clientsQueries,
        ...this.vehiclesQueries,
        ...tasksQueries,
        ...staffQueries,
        ...projectsQueries,
        ...planningQueries,
        ...this.materialsQueries,
        ...documentsQueries,
      };

      this.logger.log(
        `Nombre total de requêtes à indexer: ${Object.keys(allQueries).length}`,
      );

      // Préparer les opérations pour l'indexation en masse
      const operations: any[] = [];
      let count = 0;

      for (const [queryId, queryDetails] of Object.entries(allQueries)) {
        this.logger.log(`Préparation de la requête: ${queryId}`);

        // On utilise une assertion de type pour éviter les erreurs de type
        const details = queryDetails;
        const keywords = details.keywords || [];
        const questions = details.questions || [];
        const description = details.description || '';
        const parameters = details.parameters || [];
        const response_format = details.response_format || '';

        // Déterminer la catégorie à partir du query_id
        const category = queryId.split('_')[0];

        // Concaténer toutes les questions pour générer l'embedding
        const questionsText = questions.join(' ');

        // Générer l'embedding pour les questions
        this.logger.log(`Génération de l'embedding pour: ${queryId}`);
        const questionsVector =
          await this.vectorStoreService.generateEmbedding(questionsText);

        // Ajouter les opérations d'indexation
        operations.push(
          { index: { _index: this.queriesIndexName } },
          {
            query_id: queryId,
            category,
            keywords,
            questions,
            description,
            parameters,
            response_format,
            questions_vector: questionsVector,
            created_at: new Date(),
          },
        );

        count++;
        this.logger.log(
          `Requête ${count}/${Object.keys(allQueries).length} préparée: ${queryId}`,
        );
      }

      // Exécuter l'opération d'indexation en masse
      if (operations.length > 0) {
        this.logger.log(
          `Envoi de ${operations.length / 2} requêtes à Elasticsearch...`,
        );
        const response = (await this.client.bulk({
          body: operations,
          refresh: true,
        })) as BulkResponse;

        this.logger.log(
          `Indexation des requêtes prédéfinies réussie: ${response.items?.length || 0} requêtes traitées`,
        );

        if (response.errors) {
          this.logger.warn(
            `Certaines erreurs se sont produites lors de l'indexation des requêtes`,
          );
          return { success: true, count: response.items?.length || 0 };
        }

        return { success: true, count };
      }

      return { success: true, count: 0 };
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de l'indexation des requêtes prédéfinies: ${error.message}`,
      );
      throw error;
    }
  }

  async findSimilarPredefinedQueries(
    questionText: string,
    limit: number = 5,
    additionalParams: Record<string, unknown> = {},
  ): Promise<any[]> {
    try {
      // Générer l'embedding pour la question
      const questionVector =
        await this.vectorStoreService.generateEmbedding(questionText);

      // Rechercher des requêtes prédéfinies similaires basées sur la similarité vectorielle
      const response = (await this.client.search({
        index: this.queriesIndexName,
        size: limit,
        query: {
          bool: {
            should: [
              // Recherche de similarité vectorielle (RAG)
              {
                script_score: {
                  query: { match_all: {} },
                  script: {
                    source:
                      "cosineSimilarity(params.query_vector, 'questions_vector') + 1.0",
                    params: { query_vector: questionVector },
                  },
                },
              },
              // Recherche textuelle pour les mots-clés dans les questions et descriptions
              {
                multi_match: {
                  query: questionText,
                  fields: ['questions', 'description'],
                  fuzziness: 'AUTO', // Permet une légère tolérance aux fautes de frappe
                },
              },
            ],
            minimum_should_match: 1, // Au moins une des clauses 'should' doit correspondre
          },
        },
      })) as ElasticsearchResponse;

      // Formater les résultats
      const results = response.hits.hits.map((hit) => ({
        query_id: hit._source.query_id,
        category: hit._source.category,
        keywords: hit._source.keywords,
        questions: hit._source.questions,
        description: hit._source.description,
        parameters: hit._source.parameters,
        response_format: hit._source.response_format,
        score: hit._score,
        additionalParams: additionalParams,
      }));

      return results;
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de la recherche de requêtes prédéfinies similaires: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Recherche une requête prédéfinie par son ID
   * @param queryId L'identifiant de la requête à rechercher
   * @returns Un tableau de requêtes prédéfinies correspondant à l'ID
   */
  async findPredefinedQueryById(queryId: string): Promise<any[]> {
    try {
      const response = (await this.client.search({
        index: this.queriesIndexName,
        body: {
          query: {
            match: {
              query_id: queryId,
            },
          },
        },
      })) as ElasticsearchResponse;

      return response.hits.hits.map((hit) => ({
        ...hit._source,
        score: hit._score,
      }));
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de la recherche de la requête par ID ${queryId}: ${error.message}`,
      );
      throw error;
    }
  }

  async findSimilarQuestionsWithBoth(
    questionText: string,
    reformulatedQuestion: string,
    limit: number = 5,
  ): Promise<any[]> {
    try {
      // Générer les embeddings pour les deux versions
      const originalVector =
        await this.vectorStoreService.generateEmbedding(questionText);
      const reformulatedVector =
        await this.vectorStoreService.generateEmbedding(reformulatedQuestion);

      // Combiner les résultats des deux recherches
      const originalResults = await this.searchWithVector(
        originalVector,
        limit,
      );
      const reformulatedResults = await this.searchWithVector(
        reformulatedVector,
        limit,
      );

      // Fusionner et dédupliquer les résultats
      const combinedResults = this.mergeResults(
        originalResults,
        reformulatedResults,
      );

      return combinedResults.slice(0, limit);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la recherche avec double embedding: ${error.message}`,
      );
      throw error;
    }
  }

  private async searchWithVector(
    vector: number[],
    limit: number,
  ): Promise<any[]> {
    const response = (await this.client.search({
      index: this.indexName,
      size: limit,
      query: {
        script_score: {
          query: { match_all: {} },
          script: {
            source:
              "cosineSimilarity(params.query_vector, 'question_vector') + 1.0",
            params: { query_vector: vector },
          },
        },
      },
    })) as ElasticsearchResponse;

    return response.hits.hits.map((hit) => ({
      id: hit._id,
      question: hit._source.question,
      answer: hit._source.answer,
      category: hit._source.category,
      source: hit._source.source,
      score: hit._score,
    }));
  }

  private mergeResults(results1: any[], results2: any[]): any[] {
    // Fusionner les deux ensembles de résultats
    const merged = [...results1];
    const existingIds = new Set(results1.map((r) => r.id));

    // Ajouter seulement les résultats uniques de results2
    for (const result of results2) {
      if (!existingIds.has(result.id)) {
        merged.push(result);
      }
    }

    // Trier par score de pertinence
    return merged.sort((a, b) => b.score - a.score);
  }

  /**
   * Indexe une requête prédéfinie individuelle
   * @param queryId Identifiant de la requête
   * @param queryDetails Détails de la requête
   * @returns Un objet indiquant si l'opération a réussi
   */
  async indexSingleQuery(
    queryId: string,
    queryDetails: any,
  ): Promise<{ success: boolean; queryId: string }> {
    try {
      this.logger.log(`Vérification/indexation de la requête: ${queryId}`);

      // Vérifier si la requête existe déjà
      const existingQuery = await this.client.search({
        index: this.queriesIndexName,
        body: {
          query: {
            match: {
              query_id: queryId,
            },
          },
        },
      });

      // Si la requête existe déjà, la supprimer
      if (existingQuery.hits.hits.length > 0) {
        const existingId = existingQuery.hits.hits[0]._id;
        await this.client.delete({
          index: this.queriesIndexName,
          id: existingId,
        });
        this.logger.log(`Requête existante ${queryId} supprimée`);
      }

      // Générer l'embedding pour les questions
      const questionsText = queryDetails.questions.join(' ');
      const questionsVector = await this.vectorStoreService.generateEmbedding(
        questionsText,
      );

      // Déterminer la catégorie à partir du query_id
      const category = queryId.split('_')[0];

      // Indexer la requête
      await this.client.index({
        index: this.queriesIndexName,
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
        refresh: true,
      });

      this.logger.log(`Requête ${queryId} indexée avec succès`);
      return { success: true, queryId };
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'indexation de la requête ${queryId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Indexe un ensemble spécifique de requêtes prédéfinies
   * @param queries Les requêtes à indexer
   * @returns Un objet indiquant si l'opération a réussi et combien de requêtes ont été indexées
   */
  async indexMultipleQueries(
    queries: Record<string, any>,
  ): Promise<{ success: boolean; count: number }> {
    try {
      this.logger.log(
        `Indexation de ${Object.keys(queries).length} requêtes spécifiques...`,
      );

      let count = 0;
      for (const [queryId, queryDetails] of Object.entries(queries)) {
        try {
          await this.indexSingleQuery(queryId, queryDetails);
          count++;
        } catch (error) {
          this.logger.error(
            `Erreur lors de l'indexation de ${queryId}: ${error.message}`,
          );
          // Continuer avec les autres requêtes même si une échoue
        }
      }

      return { success: true, count };
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'indexation multiple de requêtes: ${error.message}`,
      );
      throw error;
    }
  }

  async deleteAllDocuments() {
    try {
      console.log('🚀 Début de la suppression de tous les documents...');
      
      // Suppression des documents de l'index des questions
      console.log('📝 Suppression des documents de l\'index des questions...');
      const questionsResult = await this.client.deleteByQuery({
        index: this.indexName,
        body: {
          query: {
            match_all: {},
          },
        },
      });
      const questionsDeleted = questionsResult.deleted ?? 0;
      console.log(`✅ ${questionsDeleted} documents supprimés de l'index des questions`);

      // Suppression des documents de l'index des requêtes prédéfinies
      console.log('📝 Suppression des documents de l\'index des requêtes prédéfinies...');
      const queriesResult = await this.client.deleteByQuery({
        index: this.queriesIndexName,
        body: {
          query: {
            match_all: {},
          },
        },
      });
      const queriesDeleted = queriesResult.deleted ?? 0;
      console.log(`✅ ${queriesDeleted} documents supprimés de l'index des requêtes prédéfinies`);

      console.log('🎉 Suppression terminée avec succès !');
      return {
        message: 'Tous les documents ont été supprimés avec succès',
        deleted: {
          questions: questionsDeleted,
          queries: queriesDeleted,
          total: questionsDeleted + queriesDeleted
        }
      };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression des documents:', error);
      throw error;
    }
  }
}
