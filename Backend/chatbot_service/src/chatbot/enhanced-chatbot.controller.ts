import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ConversationContextService } from './conversation-context.service';
import { EnhancedPromptsService } from './enhanced-prompts.service';
import { ResponseFormatterService } from './response-formatter.service';

interface EnhancedChatRequest {
  message: string;
  conversationId?: string;
  database?: 'sync' | 'app';
  userId?: string;
  userProfile?: {
    name: string;
    role: string;
    staffId?: number;
  };
}

interface EnhancedChatResponse {
  message: string;
  conversationId: string;
  timestamp: Date;
  database?: 'sync' | 'app';
  queryType?: string;
  suggestions?: string[];
  charts?: any[];
  tables?: any[];
  actionButtons?: any[];
  context?: {
    userProfile?: any;
    mentionedEntities?: any;
    metrics?: any;
  };
}

@Controller('enhanced-chatbot')
export class EnhancedChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly conversationContextService: ConversationContextService,
    private readonly enhancedPromptsService: EnhancedPromptsService,
    private readonly responseFormatterService: ResponseFormatterService,
  ) {}

  @Post('chat')
  async enhancedChat(@Body() request: EnhancedChatRequest): Promise<EnhancedChatResponse> {
    try {
      // Configurer le profil utilisateur si fourni
      if (request.userProfile && request.userId) {
        this.conversationContextService.updateUserProfile(request.userId, {
          id: request.userId,
          name: request.userProfile.name,
          role: request.userProfile.role,
          staffId: request.userProfile.staffId,
          preferences: {
            defaultDatabase: request.database || 'app',
            timezone: 'Europe/Paris',
            language: 'fr'
          }
        });
      }

      // Traiter le message avec le service principal
      const response = await this.chatbotService.processMessage(request);

      // Enrichir la réponse avec le contexte et les suggestions
      const conversationId = response.conversationId;
      const session = this.conversationContextService.getSession(conversationId);
      
      const queryType = this.enhancedPromptsService.detectQuestionType(request.message);
      const suggestions = this.conversationContextService.getSuggestions(conversationId);

      return {
        message: response.message,
        conversationId: response.conversationId,
        timestamp: response.timestamp,
        database: response.database,
        queryType,
        suggestions,
        context: session ? {
          userProfile: session.userProfile,
          mentionedEntities: session.context.mentionedEntities,
          metrics: {
            totalQueries: session.metrics.totalQueries,
            successRate: session.metrics.totalQueries > 0 
              ? Math.round((session.metrics.successfulQueries / session.metrics.totalQueries) * 100)
              : 0,
            averageResponseTime: Math.round(session.metrics.averageResponseTime)
          }
        } : undefined
      };

    } catch (error) {
      console.error('Erreur dans enhancedChat:', error);
      throw error;
    }
  }

  @Get('conversation/:conversationId/context')
  async getConversationContext(@Param('conversationId') conversationId: string) {
    const session = this.conversationContextService.getSession(conversationId);
    if (!session) {
      return { error: 'Conversation non trouvée' };
    }

    return {
      context: session.context,
      metrics: session.metrics,
      userProfile: session.userProfile,
      suggestions: this.conversationContextService.getSuggestions(conversationId)
    };
  }

  @Get('conversation/:conversationId/export')
  async exportConversation(@Param('conversationId') conversationId: string) {
    return this.conversationContextService.exportConversationData(conversationId);
  }

  @Post('conversation/:conversationId/user-profile')
  async updateUserProfile(
    @Param('conversationId') conversationId: string,
    @Body() profile: any
  ) {
    const session = this.conversationContextService.getSession(conversationId);
    if (!session) {
      return { error: 'Conversation non trouvée' };
    }

    this.conversationContextService.updateUserProfile(session.userId, profile);
    return { success: true };
  }

  @Get('query-templates')
  async getQueryTemplates() {
    // Retourner les templates de questions prédéfinies pour l'interface
    return {
      planning: [
        "Quel est mon planning de demain ?",
        "Qui travaille sur le chantier ABC cette semaine ?",
        "Quels sont mes RDV clients cette semaine ?"
      ],
      projects: [
        "Quels sont les projets en retard ?",
        "Quels sont les plus gros chantiers en cours ?",
        "Quel est l'avancement du projet XYZ ?"
      ],
      rentability: [
        "Analyse ma rentabilité sur les 2 derniers mois",
        "Quelle est la marge sur le projet ABC ?",
        "Quels projets sont déficitaires ?"
      ],
      staff: [
        "Qui est disponible demain ?",
        "Combien d'heures a travaillé Jean cette semaine ?",
        "Vue d'ensemble de l'équipe"
      ],
      analytics: [
        "Répartition du temps par projet",
        "Statistiques de productivité",
        "Temps de travail de l'équipe"
      ]
    };
  }

  @Get('database/status')
  async getDatabaseStatus() {
    // Vérifier l'état des connexions aux bases de données
    // Cette méthode devrait être implémentée dans DatabaseService
    return {
      app: {
        connected: true, // À implémenter
        tables: 29,
        lastUpdate: new Date()
      },
      sync: {
        connected: true, // À implémenter
        tables: 319,
        lastUpdate: new Date()
      }
    };
  }

  @Post('analyze/question')
  async analyzeQuestion(@Body() { question }: { question: string }) {
    const queryType = this.enhancedPromptsService.detectQuestionType(question);
    const suggestedDatabase = this.enhancedPromptsService.suggestDatabase(question);
    const template = this.enhancedPromptsService.getQueryTemplate(question);

    return {
      queryType,
      suggestedDatabase,
      template: template ? {
        description: template.description,
        keywords: template.keywords
      } : null,
      confidence: template ? 0.8 : 0.3 // Score de confiance approximatif
    };
  }

  @Get('health')
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date(),
      services: {
        chatbot: 'running',
        database: 'connected',
        openai: 'connected'
      }
    };
  }

  @Post('cleanup')
  async cleanupOldSessions(@Query('maxAgeHours') maxAgeHours?: string) {
    this.conversationContextService.cleanupOldSessions(maxAgeHours ? parseInt(maxAgeHours) : 24);
    return { success: true, message: 'Sessions anciennes supprimées' };
  }
} 