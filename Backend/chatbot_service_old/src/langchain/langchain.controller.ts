import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { AnalyzeAgentService } from '../analyze_agent/analyze_agent.service';
import { QueryExecutorService } from '../analyze_agent/query-executor.service';

// Interfaces nécessaires
class AnalyzeQuestionDto {
  question: string;
}

interface ChatbotResponse {
  analysis: any;
  message?: string;
  query_executed?: string;
  query_description?: string;
  data?: unknown;
  response_format?: string;
}

@Controller('langchain')
export class LangchainController {
  private readonly logger = new Logger(LangchainController.name);

  constructor(
    @Inject(forwardRef(() => AnalyzeAgentService))
    private readonly analyzeAgentService: AnalyzeAgentService,
    @Inject(forwardRef(() => QueryExecutorService))
    private readonly queryExecutorService: QueryExecutorService,
    private readonly langchainService: LangchainService,
  ) {}

  @Post('chatbot')
  async processChatbotQuestion(
    @Body() analyzeQuestionDto: AnalyzeQuestionDto,
  ): Promise<ChatbotResponse> {
    try {
      if (
        !analyzeQuestionDto.question ||
        analyzeQuestionDto.question.trim() === ''
      ) {
        throw new HttpException(
          'La question ne peut pas être vide',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Étape 1: Analyser la question avec LangChain
      const langchainAnalysis = await this.langchainService.analyzeQuestion(
        analyzeQuestionDto.question,
      );

      // Étape 2: Utiliser l'analyse Elasticsearch pour trouver des requêtes prédéfinies
      const analysisResult = await this.analyzeAgentService.analyzeQuestion(
        analyzeQuestionDto.question,
      );

      // Fusionner les résultats d'analyse
      const mergedAnalysis = {
        ...analysisResult,
        langchain: langchainAnalysis,
      };

      // Étape 3: Vérifier si des requêtes prédéfinies ont été trouvées
      if (
        !analysisResult.similarPredefinedQueries ||
        analysisResult.similarPredefinedQueries.length === 0
      ) {
        return {
          analysis: mergedAnalysis,
          message: "Aucune requête prédéfinie correspondante n'a été trouvée.",
          data: null,
        };
      }

      // Étape 4: Exécuter la requête la plus pertinente
      const topQuery = analysisResult.similarPredefinedQueries[0];
      try {
        const queryResult = await this.queryExecutorService.executeQuery(
          topQuery.query_id,
          {},
        );

        // Étape 5: Générer une réponse naturelle avec LangChain
        const naturalResponse = await this.langchainService.generateResponse(
          {
            originalQuestion: analyzeQuestionDto.question,
            analysis: mergedAnalysis,
          },
          queryResult.data,
        );

        return {
          analysis: mergedAnalysis,
          query_executed: topQuery.query_id,
          query_description: topQuery.description,
          data: queryResult.data,
          response_format: queryResult.response_format,
          message: naturalResponse,
        };
      } catch (queryError) {
        if (queryError instanceof NotFoundException) {
          return {
            analysis: mergedAnalysis,
            message: `La requête ${topQuery.query_id} n'a pas pu être exécutée: ${queryError.message}`,
            data: null,
          };
        }
        throw queryError;
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement de la question chatbot: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors du traitement de la question: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
