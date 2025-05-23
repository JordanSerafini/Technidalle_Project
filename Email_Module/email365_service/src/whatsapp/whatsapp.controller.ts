import { Body, Controller, Get, Post, Query, Logger } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsappService: WhatsappService) {}

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
  async receiveMessage(@Body() body: any): Promise<{ success: boolean }> {
    this.logger.log('Webhook reçu de WhatsApp');
    await this.whatsappService.processWebhookEvent(body);
    return { success: true };
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
}
