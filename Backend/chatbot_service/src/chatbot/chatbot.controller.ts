import { Controller, Post, Get, Body, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatRequest, ChatResponse } from './dto/chat.dto';

@Controller('chatbot')
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

  @Get('conversation/:id/history')
  async getConversationHistory(@Param('id') conversationId: string) {
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
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw new HttpException(
        error.message || 'Erreur interne du serveur',
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
      service: 'Chatbot Service',
      timestamp: new Date(),
      message: 'Service chatbot opérationnel'
    };
  }

  @Get('databases/status')
  async getDatabaseStatus() {
    // Cette méthode sera implémentée après avoir résolu les problèmes de dépendances
    return {
      sync: 'unknown',
      app: 'unknown',
      message: 'Vérification du statut des bases de données...'
    };
  }
} 