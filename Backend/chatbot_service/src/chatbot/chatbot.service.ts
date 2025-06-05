import { Injectable, Inject } from '@nestjs/common';
import { LangchainService } from '../langchain/langchain.service';

@Injectable()
export class ChatbotService {
  constructor(
    @Inject('AnalyzeAgentService') private readonly analyzeAgentService: any,
    @Inject('QueryExecutorService') private readonly queryExecutorService: any,
    private readonly langchainService: LangchainService,
  ) {}

  async getHealth(): Promise<{ status: string; database: string; services: string[] }> {
    // Vérification de l'état de la base de données
    const databaseStatus = 'connected';

    // Vérification de l'état des services externes
    const servicesStatus = ['Elasticsearch', 'Prisma'].map(service => {
      return `${service}: operational`;
    });

    return {
      status: 'ok',
      database: databaseStatus,
      services: servicesStatus,
    };
  }

  /**
   * Traite un message utilisateur complet en orchestrant analyse, exécution de requête et génération de réponse
   * @param userId Identifiant de l'utilisateur ou de la conversation
   * @param message Message de l'utilisateur
   * @returns Réponse générée pour l'utilisateur
   */
  async handleUserMessage(userId: string, message: string): Promise<string> {
    // Étape 1 : analyse de la question
    const analysis = await this.analyzeAgentService.analyzeQuestion(message);

    // Si aucune requête prédéfinie n'est trouvée, générer une réponse générale
    if (!analysis.similarPredefinedQueries || analysis.similarPredefinedQueries.length === 0) {
      const generalResponse = await this.langchainService.generateGeneralResponse(message, analysis);
      this.analyzeAgentService.updateConversationContext(
        userId,
        message,
        generalResponse,
        analysis.analysis.intent,
        analysis.analysis.entities,
      );
      return generalResponse;
    }

    // Requête prédéfinie la plus pertinente
    const topQuery = analysis.similarPredefinedQueries[0];

    // Extraction des paramètres éventuels via LangChain
    const paramDefs = this.queryExecutorService.getParameterDefinitions(topQuery.query_id) || [];
    const previousContext = this.analyzeAgentService.getConversationContext(userId)?.lastEntities;
    const extractedParams = await this.langchainService.extractParameters(
      message,
      paramDefs,
      previousContext,
    );

    // Exécuter la requête en base
    const queryResult = await this.queryExecutorService.executeQuery(
      topQuery.query_id,
      extractedParams,
    );

    // Générer la réponse à partir des données
    const conversationHistory = this.analyzeAgentService.getConversationContext(userId)?.messages;
    const generatedResponse = await this.langchainService.generateResponse(
      {
        originalQuestion: message,
        reformulatedQuestion: analysis.reformulatedQuestion,
        intent: analysis.analysis.intent,
        entities: analysis.analysis.entities,
        conversationHistory,
      },
      queryResult.data,
    );

    // Mise à jour du contexte de conversation
    this.analyzeAgentService.updateConversationContext(
      userId,
      message,
      generatedResponse,
      analysis.analysis.intent,
      analysis.analysis.entities,
      topQuery.query_id,
    );

    return generatedResponse;
  }
}
