import { Controller, Post, Get, Body, Param, Delete, HttpException, HttpStatus, Query } from '@nestjs/common';
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

      return await this.chatbotService.sendMessage(request);
    } catch (error) {
      console.error('Erreur dans le contrôleur chatbot (API Gateway):', error);
      throw new HttpException(
        error.message || 'Erreur interne du serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('conversation/:id/context')
  async getConversationContext(@Param('id') conversationId: string) {
    try {
      return await this.chatbotService.getConversationHistory(conversationId);
    } catch (error) {
      console.error('Erreur lors de la récupération du contexte (API Gateway):', error);
      throw new HttpException(
        error.message || 'Erreur interne du serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('conversation/:id/export')
  async exportConversation(@Param('id') conversationId: string) {
    try {
      return await this.chatbotService.exportConversation(conversationId);
    } catch (error) {
      console.error('Erreur lors de l\'export de la conversation (API Gateway):', error);
      throw new HttpException(
        error.message || 'Erreur interne du serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('conversation/:id')
  async clearConversation(@Param('id') conversationId: string) {
    try {
      return await this.chatbotService.clearConversation(conversationId);
    } catch (error) {
      console.error('Erreur lors de la suppression de la conversation (API Gateway):', error);
      throw new HttpException(
        'Erreur lors de la suppression de la conversation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  async healthCheck() {
    try {
      return await this.chatbotService.healthCheck();
    } catch (error) {
      console.error('Erreur lors du health check (API Gateway):', error);
      return {
        status: 'ERROR',
        service: 'Enhanced Chatbot Service (via API Gateway)',
        timestamp: new Date(),
        message: 'Service chatbot indisponible via API Gateway',
        error: error.message
      };
    }
  }

  @Get('database/status')
  async getDatabaseStatus() {
    try {
      return await this.chatbotService.getDatabaseStatus();
    } catch (error) {
      console.error('Erreur lors de la vérification du statut des bases de données (API Gateway):', error);
      return {
        app: { connected: false, error: error.message },
        sync: { connected: false, error: error.message },
        message: 'Erreur lors de la vérification du statut des bases de données via API Gateway'
      };
    }
  }

  @Get('query-templates')
  async getQueryTemplates() {
    try {
      return await this.chatbotService.getQueryTemplates();
    } catch (error) {
      console.error('Erreur lors de la récupération des templates (API Gateway):', error);
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

      return await this.chatbotService.analyzeQuestion(question);
    } catch (error) {
      console.error('Erreur lors de l\'analyse de la question (API Gateway):', error);
      throw new HttpException(
        error.message || 'Erreur lors de l\'analyse de la question',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 