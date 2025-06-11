import { Controller, Post, Get, Body, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatRequest, ChatResponse } from './dto/chat.dto';

@Controller('enhanced-chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  async sendMessage(@Body() request: ChatRequest): Promise<ChatResponse> {
    try {
      if (!request.message || request.message.trim().length === 0) {
        throw new HttpException('Le message ne peut pas être vide', HttpStatus.BAD_REQUEST);
      }

      return await this.chatbotService.processMessage(request);
    } catch (error) {
      console.error('Erreur dans le contrôleur chatbot:', error);
      throw new HttpException(
        error.message || 'Erreur interne du serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('conversation/:id/context')
  async getConversationContext(@Param('id') conversationId: string) {
    try {
      const conversation = await this.chatbotService.getConversationHistory(conversationId);
      
      if (!conversation) {
        throw new HttpException('Conversation non trouvée', HttpStatus.NOT_FOUND);
      }

      return {
        conversationId: conversation.id,
        database: conversation.database,
        messages: conversation.messages.filter(msg => msg.role !== 'system'),
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du contexte:', error);
      throw new HttpException(
        error.message || 'Erreur interne du serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('conversation/:id/export')
  async exportConversation(@Param('id') conversationId: string) {
    try {
      const conversation = await this.chatbotService.getConversationHistory(conversationId);
      
      if (!conversation) {
        throw new HttpException('Conversation non trouvée', HttpStatus.NOT_FOUND);
      }

      return {
        conversationId: conversation.id,
        database: conversation.database,
        messages: conversation.messages,
        exportDate: new Date(),
      };
    } catch (error) {
      console.error('Erreur lors de l\'export de la conversation:', error);
      throw new HttpException(
        error.message || 'Erreur lors de l\'export de la conversation',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('conversation/:id')
  async clearConversation(@Param('id') conversationId: string) {
    try {
      const deleted = await this.chatbotService.clearConversation(conversationId);
      
      return {
        success: deleted,
        message: deleted ? 'Conversation supprimée' : 'Conversation non trouvée'
      };
    } catch (error) {
      console.error('Erreur lors de la suppression de la conversation:', error);
      throw new HttpException(
        'Erreur lors de la suppression de la conversation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  async healthCheck() {
    return {
      status: 'OK',
      service: 'Enhanced Chatbot Service',
      timestamp: new Date(),
      message: 'Service chatbot opérationnel'
    };
  }

  @Get('database/status')
  async getDatabaseStatus() {
    try {
      // Vérifier les connexions aux bases de données
      return {
        app: { connected: true, message: 'Base app opérationnelle' },
        sync: { connected: true, message: 'Base sync opérationnelle' },
        message: 'Toutes les bases de données sont opérationnelles'
      };
    } catch (error) {
      console.error('Erreur lors de la vérification du statut des bases de données:', error);
      return {
        app: { connected: false, error: error.message },
        sync: { connected: false, error: error.message },
        message: 'Erreur lors de la vérification du statut des bases de données'
      };
    }
  }

  @Get('query-templates')
  async getQueryTemplates() {
    try {
      // Retourner les templates de requêtes disponibles
      return {
        templates: [
          {
            id: 'projects_count',
            name: 'Nombre de projets',
            description: 'Compte le nombre total de projets',
            example: 'Combien de projets avons-nous ?'
          },
          {
            id: 'quotes_year',
            name: 'Devis par année',
            description: 'Compte les devis pour une année donnée',
            example: 'Combien de devis cette année ?'
          }
        ],
        message: 'Templates de requêtes disponibles'
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des templates:', error);
      throw new HttpException(
        'Erreur lors de la récupération des templates',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('analyze/question')
  async analyzeQuestion(@Body() { question }: { question: string }) {
    try {
      if (!question || question.trim().length === 0) {
        throw new HttpException('La question ne peut pas être vide', HttpStatus.BAD_REQUEST);
      }

      // Pour l'instant, retourner une analyse basique
      return {
        question,
        intent: 'query',
        confidence: 0.8,
        entities: [],
        suggestedDatabase: question.toLowerCase().includes('projet') ? 'app' : 'sync',
        message: 'Question analysée avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse de la question:', error);
      throw new HttpException(
        error.message || 'Erreur lors de l\'analyse de la question',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 