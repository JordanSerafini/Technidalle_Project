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
        'travail semaine prochaine': 'staff_schedule_next_week',
      };

      // Si la question exacte est dans notre mapping, forcer la requête
      if (directMappings[questionLower]) {
        forcedQueryId = directMappings[questionLower];
        this.logger.log(
          `Forçage de la requête ${forcedQueryId} pour la question "${questionLower}"`,
        );
      }

      // Si aucun matching direct, vérifier par mots-clés
      if (!forcedQueryId) {
        if (
          (questionLower.includes('semaine prochaine') ||
            questionLower.includes('semaine pro')) &&
          (questionLower.includes('travail') ||
            questionLower.includes('planning') ||
            questionLower.includes('qui'))
        ) {
          forcedQueryId = 'staff_schedule_next_week';
          this.logger.log(
            `Forçage de la requête ${forcedQueryId} par mots-clés pour la question "${questionLower}"`,
          );
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

          const generatedResponse =
            await this.langchainService.generateResponse(
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
          this.logger.error(
            `Erreur lors de l'exécution de la requête forcée ${forcedQueryId}: ${forcedQueryError.message}`,
          );
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
        // Extraction préalable des entités potentiellement utiles
        const clientEntity = analysisResult.analysis.entities?.find(
          (e: any) =>
            e.type?.toLowerCase() === 'client' ||
            e.name?.toLowerCase() === 'client',
        );

        // Préparation des paramètres de la requête
        const queryParams: Record<string, unknown> = {};

        // Si une entité client est détectée, l'ajouter aux paramètres
        if (clientEntity && clientEntity.value) {
          queryParams.CLIENT = clientEntity.value;
        }

        // Extraire d'autres types de paramètres à partir des entités détectées
        this.extractParametersFromEntities(
          analysisResult.analysis.entities,
          queryParams,
        );

        queryResult = await this.queryExecutorService.executeQuery(
          topQuery.query_id,
          queryParams,
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
        // Gestion du cas CLIENT manquant dans la requête
        if (
          queryError instanceof Error &&
          queryError.message &&
          queryError.message.includes('Paramètre requis CLIENT non fourni')
        ) {
          // Tenter d'extraire le nom du client depuis la question
          const question = analyzeQuestionDto.question.toLowerCase();
          let clientName = '';

          // Extractions basées sur des patterns courants
          if (question.includes('client')) {
            const clientPattern = /client\s+([a-zÀ-ÿ\s]+)/i;
            const match = question.match(clientPattern);
            if (match && match[1]) {
              clientName = match[1].trim();
            }
          }

          // Si aucun client n'est trouvé par pattern, essayer l'extraction d'entité
          if (!clientName) {
            const clientEntity = analysisResult.analysis.entities?.find(
              (e: any) =>
                e.type?.toLowerCase() === 'client' ||
                e.name?.toLowerCase() === 'client' ||
                e.type?.toLowerCase() === 'person',
            );
            if (clientEntity && clientEntity.value) {
              clientName = clientEntity.value;
            }
          }

          if (clientName) {
            try {
              // Relancer la requête avec le nom du client trouvé
              const queryResult2 = await this.queryExecutorService.executeQuery(
                topQuery.query_id,
                { CLIENT: clientName },
              );

              const questionContext = {
                originalQuestion: analyzeQuestionDto.question,
                reformulatedQuestion: analysisResult.reformulatedQuestion,
                intent: analysisResult.analysis.intent,
                entities: analysisResult.analysis.entities,
              };

              const generatedResponse2 =
                await this.langchainService.generateResponse(
                  questionContext,
                  queryResult2.data,
                );

              return {
                analysis: analysisResult,
                query_executed: topQuery.query_id,
                query_description: queryResult2.description,
                data: queryResult2.data,
                response_format: queryResult2.response_format,
                response: generatedResponse2,
              };
            } catch (e2) {
              return {
                analysis: analysisResult,
                message: `Erreur lors de la recherche des informations du client ${clientName}: ${e2 instanceof Error ? e2.message : e2}`,
                data: null,
              };
            }
          } else {
            return {
              analysis: analysisResult,
              message:
                'Veuillez préciser le nom du client dans votre question.',
              data: null,
            };
          }
        }

        // Gestion générique des paramètres manquants
        if (queryError instanceof Error && queryError.message) {
          const missingParamMatch = queryError.message.match(
            /Paramètre requis ([A-Z_]+) non fourni/,
          );
          if (missingParamMatch && missingParamMatch[1]) {
            const paramName = missingParamMatch[1];

            // Tentative d'extraction automatique du paramètre manquant
            const extractedParam = this.tryExtractParameterFromText(
              analyzeQuestionDto.question,
              paramName,
              analysisResult.analysis.entities,
            );

            if (extractedParam) {
              try {
                // Relancer la requête avec le paramètre trouvé
                const params: Record<string, unknown> = {};
                params[paramName] = extractedParam;

                const queryResult2 =
                  await this.queryExecutorService.executeQuery(
                    topQuery.query_id,
                    params,
                  );

                const questionContext = {
                  originalQuestion: analyzeQuestionDto.question,
                  reformulatedQuestion: analysisResult.reformulatedQuestion,
                  intent: analysisResult.analysis.intent,
                  entities: analysisResult.analysis.entities,
                };

                const generatedResponse2 =
                  await this.langchainService.generateResponse(
                    questionContext,
                    queryResult2.data,
                  );

                return {
                  analysis: analysisResult,
                  query_executed: topQuery.query_id,
                  query_description: queryResult2.description,
                  data: queryResult2.data,
                  response_format: queryResult2.response_format,
                  response: generatedResponse2,
                };
              } catch (e2) {
                return {
                  analysis: analysisResult,
                  message: `Erreur lors de la recherche avec le paramètre ${paramName}: ${e2 instanceof Error ? e2.message : e2}`,
                  data: null,
                };
              }
            } else {
              // Paramètre non trouvé, demander à l'utilisateur
              let friendlyParamName = paramName;
              switch (paramName) {
                case 'CLIENT':
                  friendlyParamName = 'le nom du client';
                  break;
                case 'DATE':
                  friendlyParamName = 'la date';
                  break;
                case 'CITY':
                  friendlyParamName = 'la ville';
                  break;
                case 'PROJECT':
                  friendlyParamName = 'le projet';
                  break;
                case 'VEHICLE':
                  friendlyParamName = 'le véhicule';
                  break;
                case 'MATERIAL':
                  friendlyParamName = 'le matériel';
                  break;
                case 'TASK':
                  friendlyParamName = 'la tâche';
                  break;
                case 'EMPLOYEE':
                  friendlyParamName = 'le nom de l\'employé';
                  break;
                case 'PERIOD':
                  friendlyParamName = 'la période';
                  break;
              }

              return {
                analysis: analysisResult,
                message: `Veuillez préciser ${friendlyParamName} dans votre question.`,
                data: null,
              };
            }
          }
        }

        // Ajout de la gestion du cas PROJECT manquant
        if (
          queryError instanceof Error &&
          queryError.message &&
          queryError.message.includes('Paramètre requis PROJECT non fourni')
        ) {
          // On tente d'extraire le nom du client depuis les entités détectées
          const clientEntity = analysisResult.analysis.entities?.find(
            (e: any) =>
              e.name.toLowerCase() === 'client' ||
              e.type.toLowerCase() === 'client',
          );
          if (clientEntity && clientEntity.value) {
            const projets = await this.analyzeAgentService.getProjectsForClient(
              clientEntity.value,
            );
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
                const queryResult2 =
                  await this.queryExecutorService.executeQuery(
                    topQuery.query_id,
                    { PROJECT: projectName },
                  );
                const questionContext = {
                  originalQuestion: analyzeQuestionDto.question,
                  reformulatedQuestion: analysisResult.reformulatedQuestion,
                  intent: analysisResult.analysis.intent,
                  entities: analysisResult.analysis.entities,
                };
                const generatedResponse2 =
                  await this.langchainService.generateResponse(
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
              const listeProjets = projets
                .map((p: any) => p.name || p.reference)
                .join(', ');
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
      let context = this.analyzeAgentService.getConversationContext(
        conversationDto.userId,
      );
      if (!context) {
        context = this.analyzeAgentService.createConversationContext(
          conversationDto.userId,
        );
      }

      // Ajouter l'historique des conversations au contexte à envoyer à LangChain
      const conversationHistory = context.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
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
            const lastQueryResult =
              await this.queryExecutorService.executeQuery(
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

            const generatedResponse =
              await this.langchainService.generateResponse(
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
        const genericResponse =
          'Je ne comprends pas bien votre question. Pourriez-vous la reformuler ?';

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

  /**
   * Extrait tous les paramètres potentiels depuis les entités détectées
   * @param entities Liste des entités détectées
   * @param params Objet de paramètres à compléter
   */
  private extractParametersFromEntities(
    entities: any[] | undefined,
    params: Record<string, unknown>,
  ): void {
    if (!entities || entities.length === 0) return;

    // Mapping des types d'entités vers les noms de paramètres
    const entityTypeToParam: Record<string, string> = {
      client: 'CLIENT',
      person: 'CLIENT', // Les personnes peuvent aussi être des clients
      date: 'DATE',
      datetime: 'DATE',
      city: 'CITY',
      location: 'CITY',
      project: 'PROJECT',
      vehicle: 'VEHICLE',
      material: 'MATERIAL',
      task: 'TASK',
      employee: 'EMPLOYEE',
      staff: 'EMPLOYEE',
      period: 'PERIOD',
      timeframe: 'PERIOD',
    };

    // Parcourir les entités pour extraire les paramètres pertinents
    for (const entity of entities) {
      if (!entity || !entity.value) continue;

      // Utiliser le type d'entité s'il existe
      if (entity.type && typeof entity.type === 'string') {
        const paramName = entityTypeToParam[entity.type.toLowerCase()];
        if (paramName && !params[paramName]) {
          params[paramName] = entity.value;
        }
      }

      // Utiliser le nom d'entité s'il existe
      if (entity.name && typeof entity.name === 'string') {
        const paramName = entityTypeToParam[entity.name.toLowerCase()];
        if (paramName && !params[paramName]) {
          params[paramName] = entity.value;
        }
      }
    }
  }

  private tryExtractParameterFromText(
    text: string,
    paramName: string,
    entities: any[] | undefined,
  ): string | null {
    // Si pas d'entités à analyser, retourner null
    if (!entities || entities.length === 0) {
      return this.extractFromTextPattern(text, paramName);
    }

    // Utiliser en premier la détection d'entités
    const paramTypeMap: Record<string, string[]> = {
      'CLIENT': ['client', 'person', 'organization', 'people'],
      'DATE': ['date', 'datetime', 'time'],
      'CITY': ['city', 'location', 'place', 'address'],
      'PROJECT': ['project', 'mission', 'chantier'],
      'VEHICLE': ['vehicle', 'car', 'truck', 'transport'],
      'MATERIAL': ['material', 'equipment', 'tool'],
      'TASK': ['task', 'work', 'job', 'mission'],
      'EMPLOYEE': ['employee', 'staff', 'worker', 'technician', 'person'],
      'PERIOD': ['period', 'timeframe', 'duration', 'time', 'date'],
    };

    // Récupérer les types valides pour ce paramètre
    const validTypes = paramTypeMap[paramName] || [];

    // Chercher une entité correspondante
    const matchingEntity = entities.find((entity: any) => {
      if (!entity) return false;

      // Vérifier le type d'entité
      if (entity.type && validTypes.includes(entity.type.toLowerCase())) {
        return true;
      }

      // Vérifier le nom d'entité
      if (entity.name && validTypes.includes(entity.name.toLowerCase())) {
        return true;
      }

      return false;
    });

    // Si une entité correspondante est trouvée, utiliser sa valeur
    if (matchingEntity && matchingEntity.value) {
      return matchingEntity.value.toString();
    }

    // Si aucune entité n'est trouvée, essayer avec des patterns textuels
    return this.extractFromTextPattern(text, paramName);
  }

  private extractFromTextPattern(
    text: string,
    paramName: string,
  ): string | null {
    // Convertir le texte en minuscules pour les patterns
    const textLower = text.toLowerCase();

    // Différentes stratégies d'extraction selon le paramètre
    switch (paramName) {
      case 'CLIENT':
        // Patterns pour extraire un client
        const clientPatterns = [
          /client\s+([a-zÀ-ÿ0-9\s\-]+)/i,
          /informations? (?:de|du|sur) ([a-zÀ-ÿ0-9\s\-]+)/i,
          /(?:info|détails) (?:de|du|sur) ([a-zÀ-ÿ0-9\s\-]+)/i,
          /(?:entreprise|société) ([a-zÀ-ÿ0-9\s\-]+)/i,
          /([a-zÀ-ÿ0-9\-]{2,})/i, // Capture les mots contenant des tirets
        ];

        // Vérifier d'abord les patterns spécifiques
        for (let i = 0; i < clientPatterns.length - 1; i++) {
          const pattern = clientPatterns[i];
          const match = textLower.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }

        // Si aucun match spécifique, essayer de trouver des mots avec caractères spéciaux
        // qui pourraient être des noms d'entreprises
        const wordsWithSpecialChars = textLower.match(
          /\b([a-zÀ-ÿ0-9\-_]{2,})\b/gi,
        );
        if (wordsWithSpecialChars) {
          for (const word of wordsWithSpecialChars) {
            // Vérifier si le mot contient des caractères spéciaux
            if (word.includes('-') || word.includes('_')) {
              return word.trim();
            }
          }
        }

        // Enfin, essayer le pattern générique (risque de faux positifs)
        const genericMatch = textLower.match(
          clientPatterns[clientPatterns.length - 1],
        );
        if (genericMatch && genericMatch[1]) {
          return genericMatch[1].trim();
        }
        break;

      case 'DATE':
        // Patterns pour extraire une date
        if (textLower.includes("aujourd'hui")) {
          return new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
        }

        if (textLower.includes('demain')) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow.toISOString().split('T')[0];
        }

        // Recherche de dates au format JJ/MM/YYYY ou autres formats courants
        const datePatterns = [
          /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/,
          /(\d{1,2})[/-](\d{1,2})[/-](\d{2})/,
          /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/,
        ];

        for (const pattern of datePatterns) {
          const match = textLower.match(pattern);
          if (match) {
            // Selon le pattern, on réorganise la date
            if (pattern === datePatterns[0] || pattern === datePatterns[1]) {
              const day = match[1].padStart(2, '0');
              const month = match[2].padStart(2, '0');
              const year = match[3].length === 2 ? `20${match[3]}` : match[3];
              return `${year}-${month}-${day}`;
            } else {
              const year = match[1];
              const month = match[2].padStart(2, '0');
              const day = match[3].padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
          }
        }
        break;

      case 'CITY':
        // Patterns pour extraire une ville
        const cityPatterns = [
          /(?:à|a|dans|de|d') ([a-zÀ-ÿ\s]+)/i,
          /ville (?:de|d') ([a-zÀ-ÿ\s]+)/i,
        ];

        for (const pattern of cityPatterns) {
          const match = textLower.match(pattern);
          if (match && match[1]) {
            const city = match[1].trim();
            // Filtrer les articles et stopwords courants
            if (
              ![
                'la',
                'le',
                'les',
                'un',
                'une',
                'des',
                'nos',
                'vos',
                'leurs',
              ].includes(city)
            ) {
              return city;
            }
          }
        }
        break;

      case 'PROJECT':
        // Patterns pour extraire un projet
        const projectPatterns = [
          /projet\s+([a-zÀ-ÿ0-9\s\-_]+)/i,
          /chantier\s+([a-zÀ-ÿ0-9\s\-_]+)/i,
          /mission\s+([a-zÀ-ÿ0-9\s\-_]+)/i,
          /(?:info|détail|statut|état|avancement) (?:du|de la|sur le|sur|pour le|pour) projet ([a-zÀ-ÿ0-9\s\-_]+)/i,
          /(?:info|détail|statut|état|avancement) (?:du|de la|sur le|sur|pour le|pour) chantier ([a-zÀ-ÿ0-9\s\-_]+)/i,
          /référence\s+([a-zÀ-ÿ0-9\-_]+)/i,
        ];

        for (const pattern of projectPatterns) {
          const match = textLower.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        break;

      case 'VEHICLE':
        // Patterns pour extraire un véhicule
        const vehiclePatterns = [
          /véhicule\s+([a-zÀ-ÿ0-9\s]+)/i,
          /voiture\s+([a-zÀ-ÿ0-9\s]+)/i,
          /camion\s+([a-zÀ-ÿ0-9\s]+)/i,
          /utilitaire\s+([a-zÀ-ÿ0-9\s]+)/i,
          /(?:info|détail|spécification) (?:du|de la|sur le|sur|pour le|pour) véhicule ([a-zÀ-ÿ0-9\s]+)/i,
          /immatriculation\s+([a-zÀ-ÿ0-9\s-]+)/i,
        ];

        for (const pattern of vehiclePatterns) {
          const match = textLower.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        break;

      case 'MATERIAL':
        // Patterns pour extraire un matériau
        const materialPatterns = [
          /matériau\s+([a-zÀ-ÿ0-9\s]+)/i,
          /matériel\s+([a-zÀ-ÿ0-9\s]+)/i,
          /matière\s+([a-zÀ-ÿ0-9\s]+)/i,
          /fourniture\s+([a-zÀ-ÿ0-9\s]+)/i,
          /équipement\s+([a-zÀ-ÿ0-9\s]+)/i,
          /outil\s+([a-zÀ-ÿ0-9\s]+)/i,
          /(?:info|détail|spécification) (?:du|de la|sur le|sur|pour le|pour) matériau ([a-zÀ-ÿ0-9\s]+)/i,
          /(?:info|détail|spécification) (?:du|de la|sur le|sur|pour le|pour) matériel ([a-zÀ-ÿ0-9\s]+)/i,
        ];

        for (const pattern of materialPatterns) {
          const match = textLower.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        break;

      case 'TYPE':
        // Extraction du type de document
        const typePatterns = [
          /document(?:s)? de type\s+([a-zÀ-ÿ]+)/i,
          /document(?:s)? ([a-zÀ-ÿ]+)/i,
          /(?:afficher|voir|liste des|consulter|rechercher) (?:les |des )?([a-zÀ-ÿ]+)s/i,
          /(?:les|des) ([a-zÀ-ÿ]+)s/i,
        ];

        for (const pattern of typePatterns) {
          const match = textLower.match(pattern);
          if (match && match[1]) {
            const type = match[1].trim();
            // Vérifier si c'est un type de document valide
            if (
              [
                'devis',
                'facture',
                'bon_de_commande',
                'reçu',
                'contrat',
                'rapport',
              ].includes(type)
            ) {
              return type;
            }
          }
        }
        break;

      case 'STATUS':
        // Extraction du statut
        const statusPatterns = [
          /statut\s+([a-zÀ-ÿ_]+)/i,
          /status\s+([a-zÀ-ÿ_]+)/i,
          /état\s+([a-zÀ-ÿ_]+)/i,
          /documents? ([a-zÀ-ÿ_]+)/i,
          /(?:les|des) ([a-zÀ-ÿ_]+)/i,
        ];

        for (const pattern of statusPatterns) {
          const match = textLower.match(pattern);
          if (match && match[1]) {
            const status = match[1].trim();
            // Vérifier si c'est un statut de document valide
            if (
              [
                'brouillon',
                'en_attente',
                'valide',
                'envoye',
                'signe',
                'refuse',
                'en_cours',
                'termine',
              ].includes(status)
            ) {
              return status;
            }
          }
        }
        break;

      case 'START_DATE':
        // Pour les plages de dates, on essaie d'extraire une paire de dates
        // avec priorité à la première pour START_DATE
        const startDatePatterns = [
          /(?:entre|du|depuis) (?:le )?(\d{1,2})[/-](\d{1,2})[/-](\d{4})/i,
          /(?:entre|du|depuis) (?:le )?(\d{1,2})[/-](\d{1,2})[/-](\d{2})/i,
          /(?:entre|du|depuis) (?:le )?(\d{4})[/-](\d{1,2})[/-](\d{1,2})/i,
        ];

        for (const pattern of startDatePatterns) {
          const match = textLower.match(pattern);
          if (match) {
            if (
              pattern === startDatePatterns[0] ||
              pattern === startDatePatterns[1]
            ) {
              const day = match[1].padStart(2, '0');
              const month = match[2].padStart(2, '0');
              const year = match[3].length === 2 ? `20${match[3]}` : match[3];
              return `${year}-${month}-${day}`;
            } else {
              const year = match[1];
              const month = match[2].padStart(2, '0');
              const day = match[3].padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
          }
        }
        break;

      case 'END_DATE':
        // Pour les plages de dates, on essaie d'extraire une paire de dates
        // avec priorité à la seconde pour END_DATE
        const endDatePatterns = [
          /(?:et|au|jusqu'au|jusqu'à) (?:le )?(\d{1,2})[/-](\d{1,2})[/-](\d{4})/i,
          /(?:et|au|jusqu'au|jusqu'à) (?:le )?(\d{1,2})[/-](\d{1,2})[/-](\d{2})/i,
          /(?:et|au|jusqu'au|jusqu'à) (?:le )?(\d{4})[/-](\d{1,2})[/-](\d{1,2})/i,
        ];

        for (const pattern of endDatePatterns) {
          const match = textLower.match(pattern);
          if (match) {
            if (
              pattern === endDatePatterns[0] ||
              pattern === endDatePatterns[1]
            ) {
              const day = match[1].padStart(2, '0');
              const month = match[2].padStart(2, '0');
              const year = match[3].length === 2 ? `20${match[3]}` : match[3];
              return `${year}-${month}-${day}`;
            } else {
              const year = match[1];
              const month = match[2].padStart(2, '0');
              const day = match[3].padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
          }
        }

        // Si pas de date de fin explicite, mais une date de début existe,
        // on pourrait retourner une date par défaut (ex: 1 mois après la date de début)
        break;

      case 'EMPLOYEE':
        // Patterns pour extraire un employé
        const employeePatterns = [
          /(?:employé|salarié|technicien|personnel)\s+([a-zÀ-ÿ\s]+)/i,
          /(?:travail|planning|agenda) (?:de|du|pour) ([a-zÀ-ÿ\s]+)/i,
          /(?:qui est|horaires de) ([a-zÀ-ÿ\s]+)/i,
        ];

        for (const pattern of employeePatterns) {
          const match = textLower.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        break;

      case 'PERIOD':
        // Patterns pour extraire une période
        const periodPatterns = [
          /(?:pour|durant|pendant|sur) (?:la |cette |l')?(semaine|mois|année|journée|trimestre)/i,
          /(?:semaine|mois) (prochaine?|suivante?|précédente?|dernière?|passée?|à venir)/i,
          /(cette semaine|ce mois|aujourd'hui|demain|hier)/i,
        ];

        for (const pattern of periodPatterns) {
          const match = textLower.match(pattern);
          if (match) {
            let period;
            if (match[1]) {
              period = match[1].trim();
              
              // Convertir en valeur standardisée
              if (/semaine prochaine|semaine suivante|semaine à venir/.test(period)) {
                return 'next_week';
              } else if (/cette semaine|semaine actuelle/.test(period)) {
                return 'current_week';
              } else if (/semaine dernière|semaine passée|semaine précédente/.test(period)) {
                return 'previous_week';
              } else if (/mois prochain|mois suivant|mois à venir/.test(period)) {
                return 'next_month';
              } else if (/ce mois|mois actuel/.test(period)) {
                return 'current_month';
              } else if (/aujourd'hui/.test(period)) {
                return 'today';
              } else if (/demain/.test(period)) {
                return 'tomorrow';
              } else if (/hier/.test(period)) {
                return 'yesterday';
              }
            }
            return period || match[0].trim();
          }
        }
        break;

      case 'TASK':
        // Patterns pour extraire une tâche
        const taskPatterns = [
          /tâche\s+([a-zÀ-ÿ0-9\s\-_]+)/i,
          /activité\s+([a-zÀ-ÿ0-9\s\-_]+)/i,
          /mission\s+([a-zÀ-ÿ0-9\s\-_]+)/i,
          /(?:info|détail|statut) (?:de la|sur la|pour la) tâche ([a-zÀ-ÿ0-9\s\-_]+)/i,
        ];

        for (const pattern of taskPatterns) {
          const match = textLower.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        break;

      // Cas par défaut pour les autres types de paramètres
    }

    return null;
  }
}
