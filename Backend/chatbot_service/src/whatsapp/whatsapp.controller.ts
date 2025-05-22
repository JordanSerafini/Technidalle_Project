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
            
            // Appeler l'API d'analyse d'emails avec le nouveau endpoint
            const emailResponse = await firstValueFrom(
              this.httpService.get('http://192.168.20.225:4444/analyze-email/today/all/summary?limit=5&fastMode=true')
            );
            
            if (emailResponse.data?.summary) {
              // Vérifier si l'analyse a réussi
              if (emailResponse.data.summary.totalEmails === 0) {
                await this.whatsappService.sendTextMessage(
                  from,
                  "📧 *Aucun email à analyser*\n\nTout est à jour ! Aucun nouveau message à traiter."
                );
                return;
              }

              // Formater le message pour WhatsApp
              let formattedMessage = '📧 *Résumé de vos emails du jour*\n\n';
              
              // Aperçu général
              formattedMessage += `📊 *Aperçu:*\n`;
              formattedMessage += `• ${emailResponse.data.summary.totalEmails} email${emailResponse.data.summary.totalEmails > 1 ? 's' : ''} analysé${emailResponse.data.summary.totalEmails > 1 ? 's' : ''}\n`;
              if (emailResponse.data.summary.highPriorityCount > 0) {
                formattedMessage += `• ${emailResponse.data.summary.highPriorityCount} prioritaire${emailResponse.data.summary.highPriorityCount > 1 ? 's' : ''}\n`;
              }
              if (emailResponse.data.summary.actionRequiredCount > 0) {
                formattedMessage += `• ${emailResponse.data.summary.actionRequiredCount} action${emailResponse.data.summary.actionRequiredCount > 1 ? 's' : ''} requise${emailResponse.data.summary.actionRequiredCount > 1 ? 's' : ''}\n`;
              }
              formattedMessage += '\n';

              // Emails prioritaires
              if (emailResponse.data.summary.topPriorityEmails?.length > 0) {
                formattedMessage += `🔴 *Emails prioritaires:*\n`;
                emailResponse.data.summary.topPriorityEmails.forEach((email, index) => {
                  formattedMessage += `${index + 1}. *${email.subject}*\n`;
                  formattedMessage += `   De: ${email.from.split('<')[0].replace(/"/g, '')}\n`;
                  if (email.analysis?.summary) {
                    formattedMessage += `   📝 ${email.analysis.summary}\n`;
                  }
                  formattedMessage += '\n';
                });
              }

              // Actions requises
              if (emailResponse.data.summary.actionItems?.length > 0) {
                formattedMessage += `✅ *Actions requises:*\n`;
                emailResponse.data.summary.actionItems.slice(0, 5).forEach((action, index) => {
                  formattedMessage += `${index + 1}. ${action}\n`;
                });
                if (emailResponse.data.summary.actionItems.length > 5) {
                  formattedMessage += `... et ${emailResponse.data.summary.actionItems.length - 5} autre${emailResponse.data.summary.actionItems.length - 5 > 1 ? 's' : ''} action${emailResponse.data.summary.actionItems.length - 5 > 1 ? 's' : ''}\n`;
                }
                formattedMessage += '\n';
              }

              // Résumé général
              if (emailResponse.data.summary.overview) {
                formattedMessage += `📝 *Résumé général:*\n${emailResponse.data.summary.overview}`;
              }
              
              // Découper et envoyer le message par morceaux
              const chunks = splitIntoChunks(formattedMessage);
              for (const chunk of chunks) {
                await this.whatsappService.sendTextMessage(from, chunk);
              }
              console.log(`Résumé des emails envoyé en ${chunks.length} parties`);
            } else {
              // Message d'erreur plus explicite
              await this.whatsappService.sendTextMessage(
                from,
                "⚠️ *Erreur lors de l'analyse des emails*\n\n" +
                "Je n'ai pas pu analyser correctement vos emails. Veuillez réessayer dans quelques instants.\n\n" +
                "Si le problème persiste, contactez l'administrateur système."
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
