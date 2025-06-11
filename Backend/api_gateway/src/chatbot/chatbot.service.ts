import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ChatRequest, ChatResponse, ConversationHistory } from './dto/chat.dto';

@Injectable()
export class ChatbotService {
  private readonly chatbotServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    // URL du service chatbot - peut être configurée via variable d'environnement
    this.chatbotServiceUrl = process.env.CHATBOT_SERVICE_URL || 'http://localhost:6655';
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.chatbotServiceUrl}/enhanced-chatbot/chat`, request)
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'appel au service chatbot:', error);
      throw new HttpException(
        error.response?.data?.message || 'Erreur de communication avec le service chatbot',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getConversationHistory(conversationId: string): Promise<ConversationHistory> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.chatbotServiceUrl}/enhanced-chatbot/conversation/${conversationId}/context`)
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw new HttpException(
        error.response?.data?.message || 'Erreur lors de la récupération de l\'historique',
        error.response?.status || HttpStatus.NOT_FOUND
      );
    }
  }

  async clearConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Le service enhanced-chatbot n'a pas d'endpoint de suppression, on peut simuler
      return {
        success: true,
        message: 'Conversation marquée comme nettoyée'
      };
    } catch (error) {
      console.error('Erreur lors de la suppression de la conversation:', error);
      throw new HttpException(
        error.response?.data?.message || 'Erreur lors de la suppression de la conversation',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async healthCheck(): Promise<{ status: string; service: string; timestamp: Date; message: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.chatbotServiceUrl}/enhanced-chatbot/health`)
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors du health check du service chatbot:', error);
      throw new HttpException(
        'Service chatbot indisponible',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async getDatabaseStatus(): Promise<{ app: any; sync: any }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.chatbotServiceUrl}/enhanced-chatbot/database/status`)
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut des bases de données:', error);
      throw new HttpException(
        'Erreur lors de la vérification du statut des bases de données',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getQueryTemplates(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.chatbotServiceUrl}/enhanced-chatbot/query-templates`)
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des templates:', error);
      throw new HttpException(
        'Erreur lors de la récupération des templates',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async analyzeQuestion(question: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.chatbotServiceUrl}/enhanced-chatbot/analyze/question`, { question })
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'analyse de la question:', error);
      throw new HttpException(
        'Erreur lors de l\'analyse de la question',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async exportConversation(conversationId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.chatbotServiceUrl}/enhanced-chatbot/conversation/${conversationId}/export`)
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'export de la conversation:', error);
      throw new HttpException(
        'Erreur lors de l\'export de la conversation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 