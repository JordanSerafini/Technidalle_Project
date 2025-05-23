// whatsapp.service.ts
import { Injectable } from '@nestjs/common';
import * as https from 'https';

@Injectable()
export class WhatsappService {
  private readonly token = process.env.WHATSAPP_TOKEN;
  private readonly phoneNumberId = process.env.PHONE_NUMBER_ID;

  sendTextMessage(to: string, message: string): void {
    const data = JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    });

    const options: https.RequestOptions = {
      hostname: 'graph.facebook.com',
      path: `/v19.0/${this.phoneNumberId}/messages`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        console.log('Réponse WhatsApp API :', responseData);
      });
    });

    req.on('error', (e) => {
      console.error('Erreur envoi WhatsApp :', e.message);
    });

    req.write(data);
    req.end();
  }
}
