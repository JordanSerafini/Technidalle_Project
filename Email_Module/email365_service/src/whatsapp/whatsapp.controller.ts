/* eslint-disable */
import { Body, Controller, Get, Post, Query, Logger } from '@nestjs/common';
import { HttpService as AxiosHttpService } from '@nestjs/axios';
import { WhatsappService } from './whatsapp.service';
import { firstValueFrom } from 'rxjs';

@Controller('')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly httpService: AxiosHttpService,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    const result = this.whatsappService.verifyWebhook(mode, token, challenge);

    if (result) {
      return result;
    }

    throw new Error('Échec de la vérification du webhook');
  }

  @Post('webhook')
  async receiveMessage(@Body() body: any): Promise<string> {
      this.logger.log('Webhook reçu de WhatsApp');
    const MAX_CHARS = 6000;
    try {
      // Extraire le message et le numéro de l'expéditeur
      const message =
        body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;
      const from = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;

      if (message && from) {
        //Case Email Summary🧮
        if (message.startsWith('dailyemails')) {
          try {
            // Message de chargement
            await this.whatsappService.sendTextMessage(
              from,
              '⌛ Analyse en cours...',
            );

            // Vérifier si le message a été tronqué
            if (message.length > MAX_CHARS) {
              await this.whatsappService.sendTextMessage(
                from,
                "⚠️ Votre message a été tronqué pour respecter la limite maximale autorisée par l'IA (6000 caractères).",
              );
            }

            // Appeler le contrôleur analyze/chatbot
            const analyzeResponse = await firstValueFrom(
              this.httpService.post(
                `http://localhost:3650/users/${process.env.USERMAIL}/dailySummary`,
                {
                  message,
                  from,
                },
              ),
            );
          } catch (error) {
            this.logger.error(`Erreur lors de l'analyse: ${error.message}`);
            await this.whatsappService.sendTextMessage(
              from,
              "❌ Une erreur est survenue lors de l'analyse. Veuillez réessayer.",
            );
          }
        }
      }
    } catch (error) {}
  }

  @Post('send-text')
  async sendTextMessage(
    @Body() data: { to: string; text: string },
  ): Promise<any> {
    this.logger.log(`Demande d'envoi de message texte à ${data.to}`);
    return this.whatsappService.sendTextMessage(data.to, data.text);
  }

  @Post('send-template')
  async sendTemplateMessage(
    @Body()
    data: {
      to: string;
      templateName: string;
      language?: string;
      components?: any[];
    },
  ): Promise<any> {
    this.logger.log(`Demande d'envoi de template à ${data.to}`);
    return this.whatsappService.sendTemplateMessage(
      data.to,
      data.templateName,
      data.language || 'fr',
      data.components || [],
    );
  }

  @Post('send-document')
  async sendDocumentMessage(
    @Body() data: { to: string; documentUrl: string; caption?: string },
  ): Promise<any> {
    this.logger.log(`Demande d'envoi de document à ${data.to}`);
    return this.whatsappService.sendDocumentMessage(
      data.to,
      data.documentUrl,
      data.caption,
    );
  }

  private splitIntoChunks(text: string, maxLength = 800): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  }
}
