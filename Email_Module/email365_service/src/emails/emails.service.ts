/* eslint-disable */
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import {
  EmailMessage,
  EmailOptions,
  SendMailRequest,
} from './interfaces/email.interface';
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
    options?: EmailOptions,
    nextLink?: string,
  ): Promise<{ value: EmailMessage[] }> {
    try {
      const url = nextLink
        ? nextLink
        : `${this.graphApiUrl}/users/${userId}/messages`;
      const response = await lastValueFrom(
        this.httpService.get<any>(url, {
          params: options,
          headers: await this.getHeaders(),
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de la récupération des emails: ${error.message}`,
      );
      throw error;
    }
  }

  async getMessage(userId: string, messageId: string): Promise<EmailMessage> {
    try {
      const response = await lastValueFrom(
        this.httpService.get<EmailMessage>(
          `${this.graphApiUrl}/users/${userId}/messages/${messageId}`,
          {
            headers: await this.getHeaders(),
          },
        ),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de la récupération du message: ${error.message}`,
      );
      throw error;
    }
  }

  async getAttachments(userId: string, messageId: string): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.get<any>(
          `${this.graphApiUrl}/users/${userId}/messages/${messageId}/attachments`,
          {
            headers: await this.getHeaders(),
          },
        ),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de la récupération des pièces jointes: ${error.message}`,
      );
      throw error;
    }
  }

  async sendMail(userId: string, request: SendMailRequest): Promise<void> {
    try {
      await lastValueFrom<void>(
        this.httpService.post(
          `${this.graphApiUrl}/users/${userId}/sendMail`,
          request,
          { headers: await this.getHeaders() },
        ),
      );
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'envoi de l'email: ${error.message}`);
      throw error;
    }
  }

  async createDraft(
    userId: string,
    message: EmailMessage,
  ): Promise<EmailMessage> {
    try {
      const response = await lastValueFrom(
        this.httpService.post<EmailMessage>(
          `${this.graphApiUrl}/users/${userId}/messages`,
          message,
          { headers: await this.getHeaders() },
        ),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de la création du brouillon: ${error.message}`,
      );
      throw error;
    }
  }

  async updateDraft(
    userId: string,
    messageId: string,
    updateData: Partial<EmailMessage>,
  ): Promise<EmailMessage> {
    try {
      const response = await lastValueFrom(
        this.httpService.patch<EmailMessage>(
          `${this.graphApiUrl}/users/${userId}/messages/${messageId}`,
          updateData,
          { headers: await this.getHeaders() },
        ),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de la mise à jour du brouillon: ${error.message}`,
      );
      throw error;
    }
  }

  async deleteMessage(userId: string, messageId: string): Promise<boolean> {
    try {
      await lastValueFrom<void>(
        this.httpService.delete(
          `${this.graphApiUrl}/users/${userId}/messages/${messageId}`,
          { headers: await this.getHeaders() },
        ),
      );
      return true;
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de la suppression du message: ${error.message}`,
      );
      throw error;
    }
  }

  async getMailFolders(userId: string): Promise<any> {
    const url = `${this.graphApiUrl}/users/${userId}/mailFolders`;
    const response = await lastValueFrom(
      this.httpService.get<any>(url, { headers: await this.getHeaders() }),
    );
    return response.data;
  }

  async getMessagesFromFolder(
    userId: string,
    folderId: string,
    options?: EmailOptions,
  ): Promise<{ value: EmailMessage[] }> {
    const url = `${this.graphApiUrl}/users/${userId}/mailFolders/${folderId}/messages`;
    const response = await lastValueFrom(
      this.httpService.get<any>(url, {
        params: options,
        headers: await this.getHeaders(),
      }),
    );
    return response.data;
  }

  async createMailFolder(
    userId: string,
    folderData: { displayName: string, parentFolderId?: string }
  ): Promise<any> {
    const url = `${this.graphApiUrl}/users/${userId}/mailFolders`;
    const response = await lastValueFrom(
      this.httpService.post<any>(url, folderData, { headers: await this.getHeaders() }),
    );
    return response.data;
  }

  async deleteMailFolder(userId: string, folderId: string): Promise<boolean> {
    const url = `${this.graphApiUrl}/users/${userId}/mailFolders/${folderId}`;
    await lastValueFrom(
      this.httpService.delete(url, { headers: await this.getHeaders() }),
    );
    return true;
  }

  async moveMessage(userId: string, messageId: string, destinationId: string): Promise<any> {
    const url = `${this.graphApiUrl}/users/${userId}/messages/${messageId}/move`;
    const response = await lastValueFrom(
      this.httpService.post<any>(url, { destinationId }, { headers: await this.getHeaders() }),
    );
    return response.data;
  }

  async copyMessage(userId: string, messageId: string, destinationId: string): Promise<any> {
    const url = `${this.graphApiUrl}/users/${userId}/messages/${messageId}/copy`;
    const response = await lastValueFrom(
      this.httpService.post<any>(url, { destinationId }, { headers: await this.getHeaders() }),
    );
    return response.data;
  }

  async markAsRead(userId: string, messageId: string, isRead: boolean): Promise<EmailMessage> {
    const url = `${this.graphApiUrl}/users/${userId}/messages/${messageId}`;
    const response = await lastValueFrom(
      this.httpService.patch<EmailMessage>(url, { isRead }, { headers: await this.getHeaders() }),
    );
    return response.data;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await getToken();
    if (!token) {
      throw new Error('Token Microsoft Graph non trouvé');
    }
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
}
