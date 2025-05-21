import { Injectable } from '@nestjs/common';

interface QuestionAnalysisResult {
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
}

@Injectable()
export class AnalyzeAgentService {
  constructor() {}

  async analyzeQuestion(question: string): Promise<QuestionAnalysisResult> {
    // Logique simple de reformulation pour l'instant
    const reformulatedQuestion = this.reformulateQuestion(question);

    // Analyse basique des intentions et entités
    const analysis = {
      intent: 'information_request',
      entities: [],
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

    return {
      originalQuestion: question,
      reformulatedQuestion,
      analysis,
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
