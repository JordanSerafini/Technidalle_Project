import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { LangchainService } from '../langchain/langchain.service';

export interface QuestionAnalysisResult {
  originalQuestion: string;
  reformulatedQuestion: string;
  analysis: {
    intent: string;
    entities: Array<{
      name: string;
      value: string;
      type: string;
    }>;
    confidence: number;
  };
  similarQuestions?: Array<{
    id: string;
    question: string;
    answer: string;
    score: number;
  }>;
  similarPredefinedQueries?: Array<{
    query_id: string;
    category: string;
    description: string;
    score: number;
    questions: string[];
  }>;
}

interface SearchResult {
  id: string;
  question: string;
  answer: string;
  category?: string;
  source?: string;
  score: number;
}

interface PredefinedQueryResult {
  query_id: string;
  category: string;
  keywords: string[];
  questions: string[];
  description: string;
  parameters: any[];
  response_format: string;
  score: number;
}

@Injectable()
export class AnalyzeAgentService {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly langchainService: LangchainService,
  ) {}

  async analyzeQuestion(question: string): Promise<QuestionAnalysisResult> {
    // Utiliser LangChain pour l'analyse de la question
    const langchainAnalysis =
      await this.langchainService.analyzeQuestion(question);

    // Reformulation via LangChain
    const reformulatedQuestion = langchainAnalysis.reformulatedQuestion;

    // Création de l'objet d'analyse avec les données de LangChain
    const analysis = {
      intent: langchainAnalysis.intent,
      entities: langchainAnalysis.entities,
      confidence: 0.95, // On fait davantage confiance à LangChain qu'à l'analyse simple
    };

    // Recherche de questions similaires via Elasticsearch
    let similarQuestions: Array<{
      id: string;
      question: string;
      answer: string;
      score: number;
    }> = [];

    try {
      // Utiliser la méthode qui combine les deux questions pour une recherche plus complète
      const results =
        await this.elasticsearchService.findSimilarQuestionsWithBoth(
          question,
          reformulatedQuestion,
        );
      similarQuestions = results.map((result: SearchResult) => ({
        id: result.id,
        question: result.question,
        answer: result.answer,
        score: result.score,
      }));
    } catch (error) {
      // Gestion silencieuse des erreurs pour ne pas interrompre l'analyse
      console.error(
        'Erreur lors de la recherche de questions similaires:',
        error,
      );
    }

    // Recherche de requêtes prédéfinies similaires
    let similarPredefinedQueries: Array<{
      query_id: string;
      category: string;
      description: string;
      score: number;
      questions: string[];
    }> = [];

    try {
      const predefinedQueryResults =
        await this.elasticsearchService.findSimilarPredefinedQueries(question);

      // Filtrer les requêtes selon la catégorie identifiée par LangChain si disponible
      const filteredResults = langchainAnalysis.category
        ? predefinedQueryResults.filter(
            (r) =>
              r.category.toLowerCase() ===
              langchainAnalysis.category.toLowerCase(),
          )
        : predefinedQueryResults;

      // Si le filtrage supprime toutes les requêtes, on garde les originales
      const resultsToUse =
        filteredResults.length > 0 ? filteredResults : predefinedQueryResults;

      similarPredefinedQueries = resultsToUse.map(
        (result: PredefinedQueryResult) => ({
          query_id: result.query_id,
          category: result.category,
          description: result.description,
          score: result.score,
          questions: result.questions,
        }),
      );

      // Ajout des requêtes suggérées par LangChain si elles existent
      if (
        langchainAnalysis.possibleQueries &&
        langchainAnalysis.possibleQueries.length > 0
      ) {
        // Recherche des requêtes par ID dans Elasticsearch
        for (const queryId of langchainAnalysis.possibleQueries) {
          // Vérifier si la requête n'est pas déjà dans la liste
          if (!similarPredefinedQueries.some((q) => q.query_id === queryId)) {
            try {
              const matchingQueries =
                await this.elasticsearchService.findPredefinedQueryById(
                  queryId,
                );
              if (matchingQueries && matchingQueries.length > 0) {
                const query = matchingQueries[0];
                similarPredefinedQueries.push({
                  query_id: query.query_id,
                  category: query.category,
                  description: query.description,
                  score: 0.98, // Score élevé car suggéré par LangChain
                  questions: query.questions,
                });
              }
            } catch (error) {
              console.error(
                `Erreur lors de la recherche de la requête ${queryId}:`,
                error,
              );
            }
          }
        }

        // Trier les requêtes par score, les plus élevés en premier
        similarPredefinedQueries.sort((a, b) => b.score - a.score);
      }
    } catch (error) {
      // Gestion silencieuse des erreurs pour ne pas interrompre l'analyse
      console.error(
        'Erreur lors de la recherche de requêtes prédéfinies similaires:',
        error,
      );
    }

    return {
      originalQuestion: question,
      reformulatedQuestion,
      analysis,
      similarQuestions,
      similarPredefinedQueries,
    };
  }
}
