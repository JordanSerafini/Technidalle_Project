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
import { LangchainService } from '../langchain/langchain.service';

class AnalyzeQuestionDto {
  question: string;
}

class ExecuteQueryDto {
  query_id: string;
  parameters?: Record<string, unknown>;
}

class ConversationMessageDto {
  userId: string;
  message: string;
}

interface ChatbotResponse {
  analysis?: any;
  message?: string;
  query_executed?: string;
  query_description?: string;
  data?: unknown;
  response_format?: string;
  response?: string;
}

@Controller('analyze')
export class AnalyzeAgentController {
  private readonly logger = new Logger(AnalyzeAgentController.name);

  constructor(
    private readonly analyzeAgentService: AnalyzeAgentService,
    private readonly queryExecutorService: QueryExecutorService,
    private readonly langchainService: LangchainService,
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

      // Détection spécifique pour des requêtes connues qui peuvent avoir des problèmes de matching
      const questionLower = analyzeQuestionDto.question.toLowerCase().trim();
      let forcedQueryId: string | null = null;
      
      // Mappings directs pour certaines questions spécifiques qui peuvent avoir des problèmes de matching
      const directMappings: Record<string, string> = {
        'qui travaille la semaine prochaine': 'staff_schedule_next_week',
        'qui travaille la semaine pro': 'staff_schedule_next_week',
        'qui est prévu la semaine prochaine': 'staff_schedule_next_week',
        'planning semaine prochaine': 'staff_schedule_next_week',
        'qui travaille semaine prochaine': 'staff_schedule_next_week',
        'travail semaine prochaine': 'staff_schedule_next_week'
      };
      
      // Si la question exacte est dans notre mapping, forcer la requête
      if (directMappings[questionLower]) {
        forcedQueryId = directMappings[questionLower];
        this.logger.log(`Forçage de la requête ${forcedQueryId} pour la question "${questionLower}"`);
      }
      
      // Si aucun matching direct, vérifier par mots-clés
      if (!forcedQueryId) {
        if (
          (questionLower.includes('semaine prochaine') || questionLower.includes('semaine pro')) && 
          (questionLower.includes('travail') || questionLower.includes('planning') || questionLower.includes('qui'))
        ) {
          forcedQueryId = 'staff_schedule_next_week';
          this.logger.log(`Forçage de la requête ${forcedQueryId} par mots-clés pour la question "${questionLower}"`);
        }
      }

      // Étape 1: Analyser la question
      const analysisResult = await this.analyzeAgentService.analyzeQuestion(
        analyzeQuestionDto.question,
      );

      // Si on a un forçage de requête, l'appliquer
      if (forcedQueryId) {
        try {
          // Exécuter la requête forcée
          const queryResult = await this.queryExecutorService.executeQuery(
            forcedQueryId,
            {},
          );

          // Générer une réponse naturelle avec LangChain
          const questionContext = {
            originalQuestion: analyzeQuestionDto.question,
            reformulatedQuestion: analysisResult.reformulatedQuestion,
            intent: analysisResult.analysis.intent,
            entities: analysisResult.analysis.entities,
          };

          const generatedResponse = await this.langchainService.generateResponse(
            questionContext,
            queryResult.data,
          );

          return {
            analysis: analysisResult,
            query_executed: forcedQueryId,
            query_description: queryResult.description,
            data: queryResult.data,
            response_format: queryResult.response_format,
            response: generatedResponse,
          };
        } catch (forcedQueryError) {
          this.logger.error(`Erreur lors de l'exécution de la requête forcée ${forcedQueryId}: ${forcedQueryError.message}`);
          // Si la requête forcée échoue, continuer avec le processus normal
        }
      }

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
      let queryResult;
      let generatedResponse = '';

      try {
        queryResult = await this.queryExecutorService.executeQuery(
          topQuery.query_id,
          {},
        );

        // Étape 4: Générer une réponse naturelle avec LangChain
        const questionContext = {
          originalQuestion: analyzeQuestionDto.question,
          reformulatedQuestion: analysisResult.reformulatedQuestion,
          intent: analysisResult.analysis.intent,
          entities: analysisResult.analysis.entities,
        };

        generatedResponse = await this.langchainService.generateResponse(
          questionContext,
          queryResult.data,
        );

        return {
          analysis: analysisResult,
          query_executed: topQuery.query_id,
          query_description: topQuery.description,
          data: queryResult.data,
          response_format: queryResult.response_format,
          response: generatedResponse,
        };
      } catch (queryError) {
        // Ajout de la gestion du cas PROJECT manquant
        if (
          queryError instanceof Error &&
          queryError.message &&
          queryError.message.includes('Paramètre requis PROJECT non fourni')
        ) {
          // On tente d'extraire le nom du client depuis les entités détectées
          const clientEntity = analysisResult.analysis.entities?.find(
            (e: any) => e.name.toLowerCase() === 'client' || e.type.toLowerCase() === 'client'
          );
          if (clientEntity && clientEntity.value) {
            const projets = await this.analyzeAgentService.getProjectsForClient(clientEntity.value);
            if (projets.length === 0) {
              return {
                analysis: analysisResult,
                message: `Aucun projet trouvé pour le client ${clientEntity.value}.`,
                data: null,
              };
            } else if (projets.length === 1) {
              // Relancer la requête avec le nom du projet trouvé
              try {
                const projectName = projets[0].name || projets[0].reference;
                const queryResult2 = await this.queryExecutorService.executeQuery(
                  topQuery.query_id,
                  { PROJECT: projectName },
                );
                const questionContext = {
                  originalQuestion: analyzeQuestionDto.question,
                  reformulatedQuestion: analysisResult.reformulatedQuestion,
                  intent: analysisResult.analysis.intent,
                  entities: analysisResult.analysis.entities,
                };
                const generatedResponse2 = await this.langchainService.generateResponse(
                  questionContext,
                  queryResult2.data,
                );
                return {
                  analysis: analysisResult,
                  query_executed: topQuery.query_id,
                  query_description: topQuery.description,
                  data: queryResult2.data,
                  response_format: queryResult2.response_format,
                  response: generatedResponse2,
                };
              } catch (e2) {
                return {
                  analysis: analysisResult,
                  message: `Erreur lors de la récupération du projet du client : ${e2 instanceof Error ? e2.message : e2}`,
                  data: null,
                };
              }
            } else {
              // Plusieurs projets trouvés, demander à l'utilisateur de préciser
              const listeProjets = projets.map((p: any) => p.name || p.reference).join(', ');
              return {
                analysis: analysisResult,
                message: `Le client ${clientEntity.value} a plusieurs projets : ${listeProjets}. Merci de préciser le projet souhaité dans votre prochaine question.`,
                data: projets,
              };
            }
          }
        }
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

  @Post('conversation')
  async handleConversation(
    @Body() conversationDto: ConversationMessageDto,
  ): Promise<ChatbotResponse> {
    try {
      if (!conversationDto.userId) {
        throw new HttpException(
          "L'identifiant de l'utilisateur ne peut pas être vide",
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!conversationDto.message || conversationDto.message.trim() === '') {
        throw new HttpException(
          'Le message ne peut pas être vide',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Récupérer le contexte de conversation existant ou en créer un nouveau
      let context = this.analyzeAgentService.getConversationContext(conversationDto.userId);
      if (!context) {
        context = this.analyzeAgentService.createConversationContext(conversationDto.userId);
      }

      // Ajouter l'historique des conversations au contexte à envoyer à LangChain
      const conversationHistory = context.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Analyser la question avec contexte historique
      const analysisResult = await this.analyzeAgentService.analyzeQuestion(
        conversationDto.message,
      );

      // Vérifier si des requêtes prédéfinies ont été trouvées
      if (
        !analysisResult.similarPredefinedQueries ||
        analysisResult.similarPredefinedQueries.length === 0
      ) {
        // Si aucune requête trouvée, mais que nous avons un contexte précédent, essayer de continuer sur le même sujet
        if (context.lastQueryExecuted) {
          try {
            const lastQueryResult = await this.queryExecutorService.executeQuery(
              context.lastQueryExecuted,
              {}, // On pourrait extraire des paramètres de la nouvelle question ici
            );

            const questionContextWithHistory = {
              originalQuestion: conversationDto.message,
              reformulatedQuestion: analysisResult.reformulatedQuestion,
              intent: analysisResult.analysis.intent,
              entities: analysisResult.analysis.entities,
              conversationHistory,
            };

            const generatedResponse = await this.langchainService.generateResponse(
              questionContextWithHistory,
              lastQueryResult.data,
            );

            // Mettre à jour le contexte de conversation
            this.analyzeAgentService.updateConversationContext(
              conversationDto.userId,
              conversationDto.message,
              generatedResponse,
              analysisResult.analysis.intent,
              analysisResult.analysis.entities,
              context.lastQueryExecuted,
            );

            return {
              response: generatedResponse,
              query_executed: context.lastQueryExecuted,
            };
          } catch (error) {
            // En cas d'erreur, continuer avec une réponse générique
          }
        }

        // Réponse par défaut quand aucune requête n'est trouvée
        const genericResponse = "Je ne comprends pas bien votre question. Pourriez-vous la reformuler ?";
        
        // Mettre à jour le contexte de conversation
        this.analyzeAgentService.updateConversationContext(
          conversationDto.userId,
          conversationDto.message,
          genericResponse,
          analysisResult.analysis.intent,
          analysisResult.analysis.entities,
        );

        return {
          analysis: analysisResult,
          message: "Aucune requête prédéfinie correspondante n'a été trouvée.",
          response: genericResponse,
        };
      }

      // Exécuter la requête la plus pertinente
      const topQuery = analysisResult.similarPredefinedQueries[0];
      
      try {
        const queryResult = await this.queryExecutorService.executeQuery(
          topQuery.query_id,
          {}, // On pourrait extraire des paramètres de la question
        );

        // Générer une réponse naturelle avec LangChain en incluant l'historique
        const questionContextWithHistory = {
          originalQuestion: conversationDto.message,
          reformulatedQuestion: analysisResult.reformulatedQuestion,
          intent: analysisResult.analysis.intent,
          entities: analysisResult.analysis.entities,
          conversationHistory,
        };

        const generatedResponse = await this.langchainService.generateResponse(
          questionContextWithHistory,
          queryResult.data,
        );

        // Mettre à jour le contexte de conversation
        this.analyzeAgentService.updateConversationContext(
          conversationDto.userId,
          conversationDto.message,
          generatedResponse,
          analysisResult.analysis.intent,
          analysisResult.analysis.entities,
          topQuery.query_id,
        );

        return {
          response: generatedResponse,
          query_executed: topQuery.query_id,
          query_description: topQuery.description,
        };
      } catch (queryError) {
        if (queryError instanceof NotFoundException) {
          const errorResponse = `Je n'ai pas pu trouver les informations demandées.`;
          
          // Mettre à jour le contexte de conversation même en cas d'erreur
          this.analyzeAgentService.updateConversationContext(
            conversationDto.userId,
            conversationDto.message,
            errorResponse,
            analysisResult.analysis.intent,
            analysisResult.analysis.entities,
          );
          
          return {
            analysis: analysisResult,
            message: `La requête ${topQuery.query_id} n'a pas pu être exécutée: ${queryError.message}`,
            response: errorResponse,
          };
        }
        throw queryError;
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement de la conversation: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors du traitement de la conversation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
