// whatsapp.controller.ts
import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('webhook')
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) {}
  @Get()
  verifyWebhook(@Query() query): string {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode && token === VERIFY_TOKEN) {
      return challenge;
    } else {
      return 'Verification failed';
    }
  }

  // Réception des messages
  @Post()
  receiveMessage(@Body() body: any): string {
    console.log('Nouveau message WhatsApp :', JSON.stringify(body, null, 2));
    // Ici tu peux appeler un service pour traiter le message et répondre
    return 'EVENT_RECEIVED';
  }

    @Post('send')
  sendMessage(@Body() body: { to: string; message: string }) {
    this.whatsappService.sendTextMessage(body.to, body.message);
    return { status: 'ok', message: 'Message envoyé (ou en cours)' };
  }
}
