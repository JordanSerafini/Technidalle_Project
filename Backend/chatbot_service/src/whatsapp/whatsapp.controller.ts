// whatsapp.controller.ts
import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { HttpService as AxiosHttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// Fonction utilitaire pour découper les messages longs
function splitIntoChunks(text: string, chunkSize = 4096): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

@Controller('webhook')
export class WhatsappController {
    constructor(
      private readonly whatsappService: WhatsappService,
      private readonly httpService: AxiosHttpService
    ) {}

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
  async receiveMessage(@Body() body: any): Promise<string> {
    console.log('Nouveau message WhatsApp :', JSON.stringify(body, null, 2));
    
    try {
      // Extraire le message et le numéro de l'expéditeur
      const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;
      const from = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;

      if (message && from) {
        console.log(`Message reçu de ${from}: ${message}`);

        // Cas 1: -analyse:
        if (message.startsWith('-analyse:')) {
          const questionContent = message.substring('-analyse:'.length).trim();
          console.log(`Analyse demandée: "${questionContent}"`);

          try {
            // Appeler le contrôleur analyze/chatbot
            const analyzeResponse = await firstValueFrom(
              this.httpService.post('http://192.168.20.225:5599/analyze/chatbot', {
                question: questionContent
              })
            );

            // Récupérer la réponse et l'envoyer sur WhatsApp
            const responseText = analyzeResponse.data.response || 
                                 "Je n'ai pas compris votre question.";
            
            // Découper et envoyer le message par morceaux
            const chunks = splitIntoChunks(responseText);
            for (const chunk of chunks) {
              await this.whatsappService.sendTextMessage(from, chunk);
            }
            console.log(`Réponse envoyée en ${chunks.length} parties`);
          } catch (error) {
            console.error('Erreur lors de l\'analyse:', error);
            this.whatsappService.sendTextMessage(
              from, 
              "Désolé, une erreur s'est produite lors de l'analyse de votre question."
            );
          }
        }
        
        // Cas 2: -email_summary
        else if (message.trim() === '-email_summary') {
          console.log('Résumé d\'emails demandé');
          
          try {
            // Envoyer un message de chargement
            await this.whatsappService.sendTextMessage(from, "⌛ Traitement en cours...");
            
            // Appeler l'API d'analyse d'emails avec le bon endpoint WhatsApp
            const emailResponse = await firstValueFrom(
              this.httpService.get('http://192.168.20.225:4444/analyze-email/whatsapp-daily-summary?limit=5&fastMode=true')
            );
            
            console.log('Réponse API Email:', JSON.stringify(emailResponse.data, null, 2));
            
            if (emailResponse.data?.summary?.formattedMessage) {
              const formattedMessage = emailResponse.data.summary.formattedMessage;
              const chunks = splitIntoChunks(formattedMessage);
              for (const chunk of chunks) {
                await this.whatsappService.sendTextMessage(from, chunk);
              }
              console.log(`Résumé des emails envoyé en ${chunks.length} parties`);
            } else {
              await this.whatsappService.sendTextMessage(
                from,
                "Désolé, je n'ai pas pu formater correctement le résumé des emails."
              );
            }
          } catch (error) {
            console.error('Erreur lors de la récupération des emails:', error);
            this.whatsappService.sendTextMessage(
              from, 
              "Désolé, une erreur s'est produite lors de la récupération du résumé des emails."
            );
          }
        }
        
        // Cas par défaut: message non reconnu
        else {
          this.whatsappService.sendTextMessage(
            from, 
            "Commande non reconnue. Utilisez:\n-analyse: [votre question]\nou\n-email_summary"
          );
        }
      }
    } catch (error) {
      console.error('Erreur de traitement du message WhatsApp:', error);
    }

    return 'EVENT_RECEIVED';
  }

  @Post('send')
  sendMessage(@Body() body: { to: string; message: string }) {
    this.whatsappService.sendTextMessage(body.to, body.message);
    return { status: 'ok', message: 'Message envoyé (ou en cours)' };
  }
}
