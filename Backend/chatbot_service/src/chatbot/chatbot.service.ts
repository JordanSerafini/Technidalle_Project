import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VectorStoreService } from '../embedding/vector-store.service';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorStore: VectorStoreService,
    private readonly prisma: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async processQuery(
    query: string,
    conversationHistory: ChatMessage[] = [],
  ): Promise<{ response: string; sources: any[] }> {
    try {
      // 1. Rechercher les documents pertinents
      const relevantDocs = await this.vectorStore.findSimilar(query, 5);

      // 2. Construire le contexte avec les documents pertinents
      const context = relevantDocs
        .map(
          (doc) =>
            `---\nSource: ${doc.sourceType} (ID: ${doc.sourceId})\n${doc.content}`,
        )
        .join('\n\n');

      // 3. Créer les messages pour OpenAI
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `Tu es un assistant expert qui aide à répondre aux questions sur notre base de données interne. 
          Tu dois fournir des réponses précises, basées uniquement sur les informations fournies dans le contexte.
          Si tu ne connais pas la réponse, dis simplement que tu n'as pas suffisamment d'informations.
          N'invente jamais de réponses et cite toujours les sources de tes informations. 
          Réponds toujours en français.`,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: `Contexte des données pertinentes :\n\n${context}\n\nQuestion : ${query}`,
        },
      ];

      // 4. Appeler l'API OpenAI
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages as any,
        temperature: 0.3,
        max_tokens: 1000,
      });

      const responseText =
        completion.choices[0].message.content ||
        "Je n'ai pas pu générer de réponse.";

      // 5. Retourner la réponse avec les sources
      return {
        response: responseText,
        sources: relevantDocs.map((doc) => ({
          sourceType: doc.sourceType,
          sourceId: doc.sourceId,
          similarity: doc.similarity,
          metadata: doc.metadata,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement de la requête: ${error.message}`,
      );
      throw new Error(
        `Erreur lors du traitement de la requête: ${error.message}`,
      );
    }
  }

  async getDetailedInfo(sourceType: string, sourceId: number): Promise<any> {
    try {
      // Récupérer des informations détaillées sur une source spécifique
      switch (sourceType) {
        case 'projects':
          return await this.prisma.projects.findUnique({
            where: { id: sourceId },
            include: {
              clients: true,
              addresses: true,
              project_stages: true,
              project_staff: {
                include: {
                  staff: true,
                },
              },
            },
          });

        case 'clients':
          return await this.prisma.clients.findUnique({
            where: { id: sourceId },
            include: {
              addresses: true,
              projects: true,
            },
          });

        case 'staff':
          return await this.prisma.staff.findUnique({
            where: { id: sourceId },
            include: {
              roles: true,
              addresses: true,
              project_staff: {
                include: {
                  projects: true,
                },
              },
            },
          });

        default:
          throw new Error(`Type de source non pris en charge: ${sourceType}`);
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des détails: ${error.message}`,
      );
      throw error;
    }
  }
}
