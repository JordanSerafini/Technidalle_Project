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
import OpenAI from 'openai';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private readonly graphApiUrl = 'https://graph.microsoft.com/v1.0';
  private openai: OpenAI;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

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
    folderData: { displayName: string; parentFolderId?: string },
  ): Promise<any> {
    const url = `${this.graphApiUrl}/users/${userId}/mailFolders`;
    const response = await lastValueFrom(
      this.httpService.post<any>(url, folderData, {
        headers: await this.getHeaders(),
      }),
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

  async moveMessage(
    userId: string,
    messageId: string,
    destinationId: string,
  ): Promise<any> {
    const url = `${this.graphApiUrl}/users/${userId}/messages/${messageId}/move`;
    const response = await lastValueFrom(
      this.httpService.post<any>(
        url,
        { destinationId },
        { headers: await this.getHeaders() },
      ),
    );
    return response.data;
  }

  async copyMessage(
    userId: string,
    messageId: string,
    destinationId: string,
  ): Promise<any> {
    const url = `${this.graphApiUrl}/users/${userId}/messages/${messageId}/copy`;
    const response = await lastValueFrom(
      this.httpService.post<any>(
        url,
        { destinationId },
        { headers: await this.getHeaders() },
      ),
    );
    return response.data;
  }

  async markAsRead(
    userId: string,
    messageId: string,
    isRead: boolean,
  ): Promise<EmailMessage> {
    const url = `${this.graphApiUrl}/users/${userId}/messages/${messageId}`;
    const response = await lastValueFrom(
      this.httpService.patch<EmailMessage>(
        url,
        { isRead },
        { headers: await this.getHeaders() },
      ),
    );
    return response.data;
  }

  async downloadAttachment(
    userId: string,
    messageId: string,
    attachmentId: string,
  ): Promise<any> {
    const url = `${this.graphApiUrl}/users/${userId}/messages/${messageId}/attachments/${attachmentId}/$value`;
    const response = await lastValueFrom(
      this.httpService.get<any>(url, {
        headers: await this.getHeaders(),
        responseType: 'arraybuffer',
      }),
    );
    return response.data;
  }

  async sendDraft(userId: string, messageId: string): Promise<void> {
    const url = `${this.graphApiUrl}/users/${userId}/messages/${messageId}/send`;
    await lastValueFrom(
      this.httpService.post(url, {}, { headers: await this.getHeaders() }),
    );
  }

  async updateMailFolder(
    userId: string,
    folderId: string,
    updateData: { displayName?: string },
  ): Promise<any> {
    const url = `${this.graphApiUrl}/users/${userId}/mailFolders/${folderId}`;
    const response = await lastValueFrom(
      this.httpService.patch<any>(url, updateData, {
        headers: await this.getHeaders(),
      }),
    );
    return response.data;
  }

  async addFlag(
    userId: string,
    messageId: string,
    flag: any,
  ): Promise<EmailMessage> {
    const url = `${this.graphApiUrl}/users/${userId}/messages/${messageId}`;
    const response = await lastValueFrom(
      this.httpService.patch<EmailMessage>(
        url,
        { flag },
        { headers: await this.getHeaders() },
      ),
    );
    return response.data;
  }

  async setImportance(
    userId: string,
    messageId: string,
    importance: 'Low' | 'Normal' | 'High',
  ): Promise<EmailMessage> {
    const url = `${this.graphApiUrl}/users/${userId}/messages/${messageId}`;
    const response = await lastValueFrom(
      this.httpService.patch<EmailMessage>(
        url,
        { importance },
        { headers: await this.getHeaders() },
      ),
    );
    return response.data;
  }

  async oneMessageSummary(userId: string, messageId: string): Promise<string> {
    const message = await this.getMessage(userId, messageId);
    return this.getMessageSummary(message);
  }

  async dailySummary(userId: string): Promise<string> {
    const today = new Date().toISOString().split('T')[0];
    const filter = `receivedDateTime ge ${today}T00:00:00Z`;
  
    const messages = await this.getEmails(userId, { filter });
    return this.GetDailySummary(messages.value);
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

  private async getMessageSummary(message: EmailMessage): Promise<string> {
    const subject = message.subject ?? '';
    const from = message.from?.emailAddress?.address ?? '';
    const date = message.receivedDateTime ?? '';
    const body = message.body?.content ?? '';

    const prompt = `Voici un email reçu :
      Sujet : ${subject}
      Expéditeur : ${from}
      Date : ${date}
      Contenu : ${body}

    Fais-moi un résumé concis de cet email en français.`;

    try {
      const summary = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      return summary.choices[0].message.content ?? '';
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de la génération du résumé: ${error.message}`,
      );
      throw error;
    }
  }

  private async GetDailySummary(messages: EmailMessage[]): Promise<string> {
    const formattedMessages = messages
      .map((msg, i) => {
        const subject = msg.subject ?? '(sans sujet)';
        const from = msg.from?.emailAddress?.address ?? '(expéditeur inconnu)';
        const preview = msg.bodyPreview?.replace(/\r?\n/g, ' ').slice(0, 300) ?? '';
        const date = msg.receivedDateTime ?? '';
  
        return `Email ${i + 1} :
        - Sujet : ${subject}
        - Expéditeur : ${from}
        - Date : ${date}
        - Aperçu : ${preview}`;
      })
      .join('\n\n');
  
    const prompt = `Tu es un assistant professionnel. Voici une liste d'emails reçus aujourd'hui :
  
  ${formattedMessages}
  
  Résume ces emails de façon claire et concise en français. Organise le résumé par sujet ou par importance si pertinent. Ne répète pas les mêmes informations, et évite les détails inutiles. Termine par un court paragraphe global de synthèse si possible.`;
  
    try {
      const summary = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });
  
      return summary.choices[0].message.content ?? '';
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de la génération du résumé: ${error.message}`,
      );
      throw error;
    }
  }
  
}
