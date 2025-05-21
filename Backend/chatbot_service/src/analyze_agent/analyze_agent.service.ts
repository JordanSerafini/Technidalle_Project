import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

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
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async analyzeQuestion(question: string): Promise<QuestionAnalysisResult> {
    // Logique simple de reformulation
    const reformulatedQuestion = this.reformulateQuestion(question);

    // Analyse basique des intentions et entités
    const analysis = {
      intent: 'information_request',
      entities: [] as Array<{ name: string; value: string; type: string }>,
      confidence: 0.85,
    };

    // Extraction des entités basiques (exemple: dates, nombres, noms)
    const potentialEntities = question.match(/\b\d{4}\b|\b\w+\b/g) || [];
    potentialEntities.forEach((entity) => {
      if (/\d{4}/.test(entity)) {
        analysis.entities.push({
          name: 'year',
          value: entity,
          type: 'temporal',
        });
      }
    });

    // Recherche de questions similaires via Elasticsearch
    let similarQuestions: Array<{
      id: string;
      question: string;
      answer: string;
      score: number;
    }> = [];

    try {
      const results =
        await this.elasticsearchService.findSimilarQuestions(question);
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
      similarPredefinedQueries = predefinedQueryResults.map(
        (result: PredefinedQueryResult) => ({
          query_id: result.query_id,
          category: result.category,
          description: result.description,
          score: result.score,
          questions: result.questions,
        }),
      );
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

  private reformulateQuestion(question: string): string {
    // Logique simple de reformulation
    let reformulated = question.trim();

    // Capitalisation de la première lettre
    reformulated = reformulated.charAt(0).toUpperCase() + reformulated.slice(1);

    // Ajout d'un point d'interrogation si nécessaire
    if (!reformulated.endsWith('?')) {
      reformulated += ' ?';
    }

    // Expansion des abréviations communes
    reformulated = reformulated
      .replace(/\bqq\b/gi, 'quelque')
      .replace(/\bpq\b/gi, 'pourquoi')
      .replace(/\bsvp\b/gi, "s'il vous plaît");

    return reformulated;
  }
}
