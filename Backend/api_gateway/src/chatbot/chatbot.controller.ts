import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  HttpException, 
  HttpStatus,
  Logger 
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChatRequest, ChatResponse, ConversationHistory } from './dto/chat.dto';

@Controller('chatbot')
export class ChatbotController {
  private readonly logger = new Logger('ChatbotGateway');

  constructor(private readonly httpService: HttpService) {}

  @Get('health')
  async getHealth() {
    this.logger.log('🔍 Vérification de santé du service chatbot via API Gateway (port 3000)');
    try {
      const { data } = await firstValueFrom(
        this.httpService.get('/chatbot/health').pipe(
          catchError((error) => {
            this.logger.error('❌ Service chatbot indisponible');
            throw new HttpException(
              'Service chatbot indisponible',
              HttpStatus.SERVICE_UNAVAILABLE
            );
          })
        )
      );
      this.logger.log('✅ Service chatbot opérationnel');
      return {
        ...data,
        gateway: 'API Gateway - Port 3000',
        message: 'Utilisez toujours le port 3000 pour accéder au chatbot'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la vérification de santé',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('chat')
  async sendMessage(@Body() body: ChatRequest): Promise<ChatResponse> {
    this.logger.log(`💬 Nouveau message reçu via API Gateway: "${body.message.substring(0, 50)}..."`);
    
    try {
      const { data } = await firstValueFrom(
        this.httpService.post('/chatbot/chat', body).pipe(
          catchError((error) => {
            this.logger.error('❌ Erreur lors du traitement du message');
            if (error.response?.status === 400) {
              throw new HttpException(
                error.response.data?.message || 'Requête invalide',
                HttpStatus.BAD_REQUEST
              );
            }
            throw new HttpException(
              'Erreur lors du traitement du message',
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          })
        )
      );
      
      this.logger.log('✅ Message traité avec succès');
      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('❌ Erreur inattendue');
      throw new HttpException(
        'Erreur interne du serveur',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('conversation/:id/history')
  async getConversationHistory(@Param('id') conversationId: string): Promise<ConversationHistory> {
    this.logger.log(`📜 Récupération historique conversation ${conversationId} via API Gateway`);
    
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`/chatbot/conversation/${conversationId}/history`).pipe(
          catchError((error) => {
            if (error.response?.status === 404) {
              throw new HttpException(
                'Conversation non trouvée',
                HttpStatus.NOT_FOUND
              );
            }
            throw new HttpException(
              'Erreur lors de la récupération de l\'historique',
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          })
        )
      );
      
      this.logger.log('✅ Historique récupéré avec succès');
      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur interne du serveur',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('conversation/:id')
  async clearConversation(@Param('id') conversationId: string) {
    this.logger.log(`🗑️ Suppression conversation ${conversationId} via API Gateway`);
    
    try {
      const { data } = await firstValueFrom(
        this.httpService.delete(`/chatbot/conversation/${conversationId}`).pipe(
          catchError((error) => {
            throw new HttpException(
              'Erreur lors de la suppression de la conversation',
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          })
        )
      );
      
      this.logger.log('✅ Conversation supprimée avec succès');
      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur interne du serveur',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('databases/status')
  async getDatabaseStatus() {
    this.logger.log('🗄️ Vérification statut des bases de données via API Gateway');
    
    try {
      const { data } = await firstValueFrom(
        this.httpService.get('/chatbot/databases/status').pipe(
          catchError((error) => {
            throw new HttpException(
              'Erreur lors de la vérification du statut des bases de données',
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          })
        )
      );
      
      return {
        ...data,
        gateway: 'API Gateway - Port 3000',
        message: 'Statut des bases de données via API Gateway'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur interne du serveur',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('info')
  async getGatewayInfo() {
    return {
      service: 'Chatbot via API Gateway',
      port: 3000,
      chatbot_service_port: 6655,
      message: '🚀 Utilisez toujours le port 3000 pour accéder au chatbot',
      routes: {
        health: 'GET /chatbot/health',
        chat: 'POST /chatbot/chat',
        history: 'GET /chatbot/conversation/:id/history',
        clear: 'DELETE /chatbot/conversation/:id',
        databases: 'GET /chatbot/databases/status'
      }
    };
  }
}
