import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';

class IndexQuestionDto {
  question: string;
  answer: string;
  category?: string;
  source?: string;
}

class BulkIndexQuestionsDto {
  questions: IndexQuestionDto[];
}

@Controller('elasticsearch')
export class ElasticsearchController {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  @Post('questions')
  async indexQuestion(@Body() indexQuestionDto: IndexQuestionDto) {
    try {
      if (!indexQuestionDto.question || !indexQuestionDto.answer) {
        throw new HttpException(
          'La question et la réponse sont requises',
          HttpStatus.BAD_REQUEST,
        );
      }

      const id = await this.elasticsearchService.indexQuestion(
        indexQuestionDto.question,
        indexQuestionDto.answer,
        indexQuestionDto.category,
        indexQuestionDto.source,
      );

      return { id, message: 'Question indexée avec succès' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Erreur lors de l'indexation de la question",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('questions/bulk')
  async bulkIndexQuestions(@Body() bulkIndexDto: BulkIndexQuestionsDto) {
    try {
      if (!bulkIndexDto.questions || bulkIndexDto.questions.length === 0) {
        throw new HttpException(
          "Aucune question fournie pour l'indexation en masse",
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.elasticsearchService.bulkIndexQuestions(
        bulkIndexDto.questions,
      );

      return {
        message: `${bulkIndexDto.questions.length} questions indexées avec succès`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Erreur lors de l'indexation en masse des questions",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('questions/similar')
  async findSimilarQuestions(
    @Query('question') question: string,
    @Query('limit') limit: number = 5,
  ) {
    try {
      if (!question) {
        throw new HttpException(
          'Le paramètre de question est requis',
          HttpStatus.BAD_REQUEST,
        );
      }

      const results = await this.elasticsearchService.findSimilarQuestions(
        question,
        limit,
      );

      return { results };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la recherche de questions similaires',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('questions/:id')
  async getQuestionById(@Param('id') id: string) {
    try {
      if (!id) {
        throw new HttpException(
          "L'identifiant de la question est requis",
          HttpStatus.BAD_REQUEST,
        );
      }

      const question = await this.elasticsearchService.getQuestionById(id);

      return question;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la récupération de la question',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('questions/:id')
  async deleteQuestionById(@Param('id') id: string) {
    try {
      if (!id) {
        throw new HttpException(
          "L'identifiant de la question est requis",
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.elasticsearchService.deleteQuestionById(id);

      return { message: 'Question supprimée avec succès' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la suppression de la question',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('queries/index')
  async indexPredefinedQueries() {
    try {
      console.log(
        "Début de l'indexation des requêtes prédéfinies via l'API...",
      );

      const result = await this.elasticsearchService.indexPredefinedQueries();

      console.log(`Fin de l'indexation: ${result.count} requêtes indexées`);

      return {
        success: result.success,
        message: `${result.count} requêtes prédéfinies indexées avec succès`,
        count: result.count,
      };
    } catch (error) {
      console.error("Erreur lors de l'indexation des requêtes:", error);

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Erreur lors de l'indexation des requêtes prédéfinies",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('queries/similar')
  async findSimilarPredefinedQueries(
    @Query('question') question: string,
    @Query('limit') limit: number = 5,
    @Query('client') client?: string,
  ) {
    try {
      if (!question) {
        throw new HttpException(
          'Le paramètre de question est requis',
          HttpStatus.BAD_REQUEST,
        );
      }

      const additionalParams: Record<string, unknown> = {};
      if (client) {
        additionalParams.CLIENT = client;
      }

      const results =
        await this.elasticsearchService.findSimilarPredefinedQueries(
          question,
          limit,
          additionalParams,
        );

      return { results };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la recherche de requêtes prédéfinies similaires',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('queries/single')
  async indexSingleQuery(@Body() queryData: { queryId: string, queryDetails: any }) {
    try {
      if (!queryData.queryId || !queryData.queryDetails) {
        throw new HttpException(
          'L\'identifiant de requête et les détails sont requis',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.elasticsearchService.indexSingleQuery(
        queryData.queryId,
        queryData.queryDetails
      );

      return {
        success: true,
        message: `Requête ${queryData.queryId} indexée avec succès`,
        queryId: queryData.queryId
      };
    } catch (error) {
      console.error("Erreur lors de l'indexation de la requête:", error);

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de l'indexation de la requête: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('queries/batch')
  async indexMultipleQueries(@Body() queryData: { queries: Record<string, any> }) {
    try {
      if (!queryData.queries || Object.keys(queryData.queries).length === 0) {
        throw new HttpException(
          'Aucune requête fournie pour l\'indexation',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.elasticsearchService.indexMultipleQueries(queryData.queries);

      return {
        success: true,
        message: `${result.count} requêtes indexées avec succès`,
        count: result.count
      };
    } catch (error) {
      console.error("Erreur lors de l'indexation des requêtes:", error);

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de l'indexation des requêtes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('clear-all')
  async clearAllDocuments() {
    try {
      const result = await this.elasticsearchService.deleteAllDocuments();
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la suppression de tous les documents',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
