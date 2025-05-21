import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AnalyzeAgentService } from './analyze_agent.service';
import {
  QueryExecutorService,
  QueryExecutionResult,
} from './query-executor.service';

class AnalyzeQuestionDto {
  question: string;
}

class ExecuteQueryDto {
  query_id: string;
  parameters?: Record<string, unknown>;
}

interface ChatbotResponse {
  analysis: any;
  message?: string;
  query_executed?: string;
  query_description?: string;
  data?: unknown;
  response_format?: string;
}

@Controller('analyze')
export class AnalyzeAgentController {
  private readonly logger = new Logger(AnalyzeAgentController.name);

  constructor(
    private readonly analyzeAgentService: AnalyzeAgentService,
    private readonly queryExecutorService: QueryExecutorService,
  ) {}

  @Post('question')
  async analyzeQuestion(@Body() analyzeQuestionDto: AnalyzeQuestionDto) {
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

      const result = await this.analyzeAgentService.analyzeQuestion(
        analyzeQuestionDto.question,
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Une erreur est survenue lors de l'analyse de la question",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('execute-query')
  async executeQuery(
    @Body() executeQueryDto: ExecuteQueryDto,
  ): Promise<QueryExecutionResult> {
    try {
      if (!executeQueryDto.query_id) {
        throw new HttpException(
          "L'identifiant de la requête ne peut pas être vide",
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.queryExecutorService.executeQuery(
        executeQueryDto.query_id,
        executeQueryDto.parameters || {},
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'exécution de la requête: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de l'exécution de la requête: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

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

      // Étape 1: Analyser la question
      const analysisResult = await this.analyzeAgentService.analyzeQuestion(
        analyzeQuestionDto.question,
      );

      // Étape 2: Vérifier si des requêtes prédéfinies ont été trouvées
      if (
        !analysisResult.similarPredefinedQueries ||
        analysisResult.similarPredefinedQueries.length === 0
      ) {
        return {
          analysis: analysisResult,
          message: "Aucune requête prédéfinie correspondante n'a été trouvée.",
          data: null,
        };
      }

      // Étape 3: Exécuter la requête la plus pertinente
      const topQuery = analysisResult.similarPredefinedQueries[0];
      try {
        const queryResult = await this.queryExecutorService.executeQuery(
          topQuery.query_id,
          {},
        );

        return {
          analysis: analysisResult,
          query_executed: topQuery.query_id,
          query_description: topQuery.description,
          data: queryResult.data,
          response_format: queryResult.response_format,
        };
      } catch (queryError) {
        if (queryError instanceof NotFoundException) {
          // Si la requête n'est pas trouvée, retourner seulement l'analyse
          return {
            analysis: analysisResult,
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
