// whatsapp.controller.ts
import { Controller, Get, Post, Query, Body, HttpService } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { HttpService as AxiosHttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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
              this.httpService.post('http://localhost:5599/analyze/chatbot', {
                question: questionContent
              })
            );

            // Récupérer la réponse et l'envoyer sur WhatsApp
            const responseText = analyzeResponse.data.response || 
                                 "Je n'ai pas compris votre question.";
            
            this.whatsappService.sendTextMessage(from, responseText);
            console.log(`Réponse envoyée: ${responseText}`);
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
            // Obtenir la date du jour
            const today = new Date();
            const formattedToday = today.toISOString().split('T')[0]; // YYYY-MM-DD
            
            // Définir les paramètres pour l'API
            const url = `http://localhost:4444/analyze-email/date-range?startDate=2022-01-31&endDate=${formattedToday}&unseenOnly=false&summary=true&limit=20`;
            
            console.log(`Appel API: ${url}`);
            
            // Appeler l'API d'analyse d'emails
            const emailResponse = await firstValueFrom(
              this.httpService.get(url)
            );
            
            // Transformer la réponse en texte
            let responseText = "📧 Résumé des emails:\n\n";
            
            if (emailResponse.data && Array.isArray(emailResponse.data)) {
              // Si la réponse est un tableau d'emails
              const emails = emailResponse.data;
              
              if (emails.length === 0) {
                responseText = "Aucun email trouvé pour cette période.";
              } else {
                emails.forEach((email, index) => {
                  responseText += `${index + 1}. De: ${email.from || 'Inconnu'}\n`;
                  responseText += `   Objet: ${email.subject || 'Sans objet'}\n`;
                  if (email.summary) {
                    responseText += `   Résumé: ${email.summary}\n`;
                  }
                  responseText += '\n';
                });
              }
            } else {
              // Si le format de réponse est différent
              responseText += JSON.stringify(emailResponse.data);
            }
            
            // Envoyer la réponse à l'utilisateur
            this.whatsappService.sendTextMessage(from, responseText);
            console.log('Résumé des emails envoyé');
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
