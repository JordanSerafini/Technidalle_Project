import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { getToken } from 'src/utils/function';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private readonly graphApiUrl = 'https://graph.microsoft.com/v1.0';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getEmails(
    userId: string,
    options?: {
      filter?: string;
      select?: string;
      orderby?: string;
      top?: number;
    },
  ) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.graphApiUrl}/users/${userId}/messages`, {
          params: options,
          headers: await this.getHeaders(),
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des emails: ${error.message}`,
      );
      throw error;
    }
  }

  async getMessage(userId: string, messageId: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(
          `${this.graphApiUrl}/users/${userId}/messages/${messageId}`,
          {
            headers: await this.getHeaders(),
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération du message: ${error.message}`,
      );
      throw error;
    }
  }

  async sendMail(userId: string, messageData: any) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          `${this.graphApiUrl}/users/${userId}/sendMail`,
          { message: messageData },
          { headers: await this.getHeaders() },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email: ${error.message}`);
      throw error;
    }
  }

  async createDraft(userId: string, messageData: any) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          `${this.graphApiUrl}/users/${userId}/messages`,
          messageData,
          { headers: await this.getHeaders() },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création du brouillon: ${error.message}`,
      );
      throw error;
    }
  }

  async updateDraft(userId: string, messageId: string, updateData: any) {
    try {
      const response = await lastValueFrom(
        this.httpService.patch(
          `${this.graphApiUrl}/users/${userId}/messages/${messageId}`,
          updateData,
          { headers: await this.getHeaders() },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour du brouillon: ${error.message}`,
      );
      throw error;
    }
  }

  async deleteMessage(userId: string, messageId: string) {
    try {
      await lastValueFrom(
        this.httpService.delete(
          `${this.graphApiUrl}/users/${userId}/messages/${messageId}`,
          { headers: await this.getHeaders() },
        ),
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression du message: ${error.message}`,
      );
      throw error;
    }
  }

  private async getHeaders() {
    // À implémenter: récupération du token d'authentification
    const token = await getToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
}
