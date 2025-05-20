import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PREDEFINED_QUERIES } from './predefined-queries';
import { MatchedQuery, PredefinedQuery, QueryResponse, QueryResult } from './querybuilder.types';

@Injectable()
export class QueryBuilderService {
  private readonly logger = new Logger(QueryBuilderService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async processQuery(query: string): Promise<QueryResponse> {
    try {
      // 1. Analyser la requête utilisateur et trouver la meilleure correspondance
      const matchedQuery = await this.findBestMatch(query);
      
      if (!matchedQuery) {
        return {
          queryResult: {
            data: [],
            query: '',
            score: 0
          },
          formattedResponse: "Je n'ai pas trouvé de requête correspondant à votre demande."
        };
      }

      // 2. Extraire les paramètres si nécessaire
      const params = matchedQuery.extractedParams || {};
      
      // 3. Exécuter la requête Prisma
      const queryResult = await this.executeQuery(matchedQuery.predefinedQuery, params);
      
      // 4. Formater la réponse
      const formattedResponse = await this.formatResponse(
        queryResult, 
        matchedQuery.predefinedQuery,
        query
      );
      
      return {
        queryResult,
        formattedResponse
      };
    } catch (error) {
      this.logger.error(`Erreur lors du traitement de la requête: ${error.message}`);
      throw new Error(`Erreur lors du traitement de la requête: ${error.message}`);
    }
  }

  private async findBestMatch(query: string): Promise<MatchedQuery | null> {
    // 1. Calculer les scores pour chaque requête prédéfinie
    const scoredQueries = await Promise.all(
      PREDEFINED_QUERIES.map(async (predefinedQuery) => {
        const score = await this.calculateMatchScore(query, predefinedQuery);
        const extractedParams = this.extractParameters(query, predefinedQuery);
        
        return {
          predefinedQuery,
          score,
          extractedParams
        };
      })
    );

    // 2. Trier par score et prendre la meilleure correspondance
    const bestMatches = scoredQueries
      .filter(sq => sq.score > 0.6) // Seuil minimum de correspondance
      .sort((a, b) => b.score - a.score);

    return bestMatches.length > 0 ? bestMatches[0] : null;
  }

  private async calculateMatchScore(
    query: string, 
    predefinedQuery: PredefinedQuery
  ): Promise<number> {
    // 1. Score basé sur les mots-clés
    const keywordScore = this.calculateKeywordScore(query, predefinedQuery.keywords);
    
    // 2. Score basé sur la similitude sémantique avec les questions d'exemple
    const semanticScore = await this.calculateSemanticScore(query, predefinedQuery.questions);
    
    // 3. Score combiné (70% sémantique, 30% mots-clés)
    return 0.7 * semanticScore + 0.3 * keywordScore;
  }

  private calculateKeywordScore(query: string, keywords: string[]): number {
    const normalizedQuery = query.toLowerCase();
    let matchCount = 0;

    for (const keyword of keywords) {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    return keywords.length > 0 ? matchCount / keywords.length : 0;
  }

  private async calculateSemanticScore(query: string, questions: string[]): Promise<number> {
    if (questions.length === 0) return 0;

    try {
      // 1. Générer un embedding pour la requête
      const queryEmbedding = await this.generateEmbedding(query);
      
      // 2. Générer des embeddings pour chaque question
      const questionScores = await Promise.all(
        questions.map(async (question) => {
          const questionEmbedding = await this.generateEmbedding(question);
          return this.cosineSimilarity(queryEmbedding, questionEmbedding);
        })
      );
      
      // 3. Prendre le score maximum
      return Math.max(...questionScores);
    } catch (error) {
      this.logger.error(`Erreur lors du calcul du score sémantique: ${error.message}`);
      return 0;
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        input: text,
        model: 'text-embedding-3-small',
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(`Erreur lors de la génération d'embedding: ${error.message}`);
      throw error;
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private extractParameters(query: string, predefinedQuery: PredefinedQuery): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Si la requête n'a pas de paramètres, retourner un objet vide
    if (!predefinedQuery.parameters) {
      return params;
    }

    // Pour chaque paramètre défini dans la requête prédéfinie
    for (const [paramName, defaultValue] of Object.entries(predefinedQuery.parameters)) {
      // Si c'est CURRENT_YEAR, utiliser l'année en cours
      if (defaultValue === 'CURRENT_YEAR') {
        params[paramName] = new Date().getFullYear();
        continue;
      }
      
      // Chercher des valeurs pour ce paramètre dans la requête utilisateur
      // Exemple: Si dans questions on a "Projets du client {client_name}"
      // On cherche dans la requête utilisateur "Projets du client Dupont" pour extraire "Dupont"
      for (const question of predefinedQuery.questions) {
        if (question.includes(`{${paramName}}`)) {
          const parts = question.split(`{${paramName}}`);
          if (parts.length === 2) {
            const before = parts[0];
            const after = parts[1];
            
            const beforeIndex = query.toLowerCase().indexOf(before.toLowerCase());
            if (beforeIndex !== -1) {
              const startIndex = beforeIndex + before.length;
              let endIndex = query.length;
              
              if (after) {
                const afterIndex = query.toLowerCase().indexOf(after.toLowerCase(), startIndex);
                if (afterIndex !== -1) {
                  endIndex = afterIndex;
                }
              }
              
              const extractedValue = query.substring(startIndex, endIndex).trim();
              if (extractedValue) {
                params[paramName] = extractedValue;
                break;
              }
            }
          }
        }
      }
      
      // Si on n'a pas trouvé de valeur et qu'il y a une valeur par défaut (différente de CURRENT_YEAR)
      if (!params[paramName] && defaultValue !== 'CURRENT_YEAR') {
        params[paramName] = defaultValue;
      }
    }
    
    return params;
  }

  private async executeQuery(
    predefinedQuery: PredefinedQuery, 
    params: Record<string, any>
  ): Promise<QueryResult> {
    try {
      // Remplacer les paramètres dans la requête
      let queryString = predefinedQuery.prisma_query;
      
      // Exécuter la requête Prisma (en mode dynamique avec eval)
      // Note: eval est généralement déconseillé mais ici c'est notre objectif spécifique d'exécuter
      // du code dynamiquement à partir de chaînes de caractères stockées
      const prisma = this.prismaService;
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const queryFn = new Function('prisma', 'params', `return ${queryString}`);
      const data = await queryFn(prisma, params);
      
      return {
        data,
        query: queryString,
        matchedQueryId: predefinedQuery.id,
        score: 1.0
      };
    } catch (error) {
      this.logger.error(`Erreur lors de l'exécution de la requête: ${error.message}`);
      throw error;
    }
  }

  private async formatResponse(
    queryResult: QueryResult,
    predefinedQuery: PredefinedQuery,
    originalQuery: string
  ): Promise<string> {
    try {
      const { data } = queryResult;
      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return "Je n'ai pas trouvé de résultats correspondant à votre demande.";
      }

      // Utiliser l'API OpenAI pour formater la réponse de manière naturelle
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant qui formate les résultats d'une requête de base de données en français.
            Donne une réponse naturelle et concise en fonction du format demandé (${predefinedQuery.response_format}).
            
            Pour le format 'table', présente les données sous forme d'une liste claire et structurée.
            Pour le format 'list', utilise des puces ou une énumération.
            Pour le format 'text', rédige un court paragraphe qui résume les informations.
            Pour le format 'card', présente les détails comme une fiche d'information complète.
            
            N'invente aucune information et base-toi uniquement sur les données fournies.`,
          },
          {
            role: 'user',
            content: `Voici les résultats pour la requête "${originalQuery}" (Description de la requête: ${predefinedQuery.description}):\n\n${JSON.stringify(data, null, 2)}\n\nFormate ces résultats de manière naturelle et conviviale en français, au format ${predefinedQuery.response_format}.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      return response.choices[0].message.content || "Je n'ai pas pu formater les résultats.";
    } catch (error) {
      this.logger.error(`Erreur lors du formatage de la réponse: ${error.message}`);
      return JSON.stringify(queryResult.data, null, 2);
    }
  }
} 