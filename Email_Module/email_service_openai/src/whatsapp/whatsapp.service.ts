import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

interface WhatsAppResponse {
  messaging_product: string;
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string }>;
}

interface WebhookMessage {
  object: string;
  entry?: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
        }>;
      };
      field: string;
    }>;
  }>;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly whatsappToken: string;
  private readonly phoneNumberId: string;
  private readonly apiVersion = 'v18.0';
  private readonly baseUrl = 'https://graph.facebook.com';

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get<string>('WHATSAPP_TOKEN');
    const phoneId = this.configService.get<string>('PHONE_NUMBER_ID');

    if (!token) {
      throw new Error(
        "WHATSAPP_TOKEN non défini dans les variables d'environnement",
      );
    }
    if (!phoneId) {
      throw new Error(
        "PHONE_NUMBER_ID non défini dans les variables d'environnement",
      );
    }

    this.whatsappToken = token;
    this.phoneNumberId = phoneId;
  }

  async sendTextMessage(to: string, text: string): Promise<WhatsAppResponse> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const response: AxiosResponse<WhatsAppResponse> = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: text },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.whatsappToken}`,
          },
        },
      );

      this.logger.log(`Message envoyé avec succès à ${to}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de l'envoi du message WhatsApp: ${error.message || 'Erreur inconnue'}`,
      );
      throw error;
    }
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    language = 'fr',
    components: any[] = [],
  ): Promise<WhatsAppResponse> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const response: AxiosResponse<WhatsAppResponse> = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: language },
            components,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.whatsappToken}`,
          },
        },
      );

      this.logger.log(`Template envoyé avec succès à ${to}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de l'envoi du template WhatsApp: ${error.message || 'Erreur inconnue'}`,
      );
      throw error;
    }
  }

  async sendDocumentMessage(
    to: string,
    documentUrl: string,
    caption?: string,
  ): Promise<WhatsAppResponse> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const response: AxiosResponse<WhatsAppResponse> = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'document',
          document: {
            link: documentUrl,
            caption,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.whatsappToken}`,
          },
        },
      );

      this.logger.log(`Document envoyé avec succès à ${to}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de l'envoi du document WhatsApp: ${error.message || 'Erreur inconnue'}`,
      );
      throw error;
    }
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook vérifié avec succès');
      return challenge;
    }

    this.logger.error('Échec de la vérification du webhook');
    return null;
  }

  async processWebhookEvent(body: WebhookMessage): Promise<void> {
    try {
      if (body.object === 'whatsapp_business_account') {
        if (body.entry && body.entry.length > 0) {
          const changes = body.entry[0].changes;

          if (changes && changes.length > 0) {
            const messageData = changes[0].value;

            if (messageData.messages && messageData.messages.length > 0) {
              const message = messageData.messages[0];
              const from = message.from;
              const messageType = message.type;

              this.logger.log(`Message reçu de ${from}, type: ${messageType}`);

              // Traitement des différents types de messages
              if (messageType === 'text' && message.text) {
                const text = message.text.body;
                this.logger.log(`Contenu du message: ${text}`);

                // Exemple de réponse automatique
                await this.sendTextMessage(
                  from,
                  `Nous avons bien reçu votre message: "${text}". Nous vous répondrons bientôt.`,
                );
              }
            }
          }
        }
      }
    } catch (error: any) {
      this.logger.error(
        `Erreur lors du traitement du webhook: ${error.message || 'Erreur inconnue'}`,
      );
    }
  }
}
