import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VectorStoreService } from '../embedding/vector-store.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueryBuilderService } from '../querybuilder/querybuilder.service';
import OpenAI from 'openai';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RelevantDoc {
  sourceType: string;
  sourceId: number;
  content: string;
  similarity: number;
  metadata: any;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorStore: VectorStoreService,
    private readonly prisma: PrismaService,
    private readonly queryBuilder: QueryBuilderService,
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
      // 1. Essayer d'abord le query builder pour les requêtes structurées connues
      try {
        const queryBuilderResult = await this.queryBuilder.processQuery(query);
        
        if (queryBuilderResult && queryBuilderResult.formattedResponse) {
          // Si le query builder a trouvé une correspondance et généré une réponse,
          // retourner cette réponse sans utiliser le RAG
          return {
            response: queryBuilderResult.formattedResponse,
            sources: [
              {
                sourceType: 'query_builder',
                sourceId: queryBuilderResult.queryResult.matchedQueryId || 0,
                similarity: queryBuilderResult.queryResult.score || 1.0,
                metadata: { query: queryBuilderResult.queryResult.query },
              },
            ],
          };
        }
      } catch (queryBuilderError) {
        // Logger l'erreur mais continuer avec l'approche RAG
        this.logger.warn(
          `Le query builder a échoué, utilisation du RAG à la place: ${queryBuilderError.message}`,
        );
      }
      
      // 2. Si le query builder n'a pas pu répondre, utiliser l'approche RAG
      
      // Vérifier si la requête concerne des événements futurs, des projets en cours ou un planning
      const isTimeQuery = this.isTimeRelatedQuery(query);
      const isProjectStatusQuery = this.isProjectStatusQuery(query);

      let relevantDocs: RelevantDoc[] = [];
      let additionalContext = '';

      // Pour les requêtes temporelles (planning, événements futurs)
      if (isTimeQuery) {
        const timeframe = this.extractTimeframe(query);
        const upcomingEvents = await this.getUpcomingEvents(timeframe);

        if (upcomingEvents.length > 0) {
          additionalContext += this.formatUpcomingEvents(upcomingEvents);
        }
      }

      // Pour les requêtes sur l'état des projets (en cours, actifs, etc.)
      if (isProjectStatusQuery) {
        const activeProjects = await this.getActiveProjects();

        if (activeProjects.length > 0) {
          const projectsContext = this.formatActiveProjects(activeProjects);
          additionalContext = additionalContext
            ? `${additionalContext}\n\n${projectsContext}`
            : projectsContext;
        }
      }

      // Dans tous les cas, effectuer une recherche sémantique standard
      relevantDocs = await this.vectorStore.findSimilar(query, 5);

      // Construire le contexte avec les documents pertinents
      const docsContext = relevantDocs
        .map(
          (doc) =>
            `---\nSource: ${doc.sourceType} (ID: ${doc.sourceId})\n${doc.content}`,
        )
        .join('\n\n');

      // Combiner le contexte standard avec les informations supplémentaires si disponibles
      const fullContext = additionalContext
        ? `${additionalContext}\n\n${docsContext}`
        : docsContext;

      // Créer les messages pour OpenAI avec un prompt amélioré
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `Tu es un assistant expert qui aide à répondre aux questions sur notre base de données interne. 
          Tu dois fournir des réponses précises, basées uniquement sur les informations fournies dans le contexte.
          
          Pour les questions relatives au planning, aux événements ou aux chantiers à venir, utilise en priorité 
          les informations temporelles fournies dans le contexte sous "ÉVÉNEMENTS À VENIR" ou "PROJETS ACTIFS".
          
          Si on te demande des informations sur des projets "en cours" ou "actifs", priorise les informations
          listées sous "PROJETS ACTIFS" dans le contexte.
          
          Si on te demande des informations sur "la semaine prochaine", "le mois prochain" ou d'autres périodes futures,
          réponds en fonction des événements listés pour cette période.
          
          Si tu ne connais pas la réponse, dis simplement que tu n'as pas suffisamment d'informations.
          N'invente jamais de réponses et cite toujours les sources de tes informations. 
          Réponds toujours en français.`,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: `Contexte des données pertinentes :\n\n${fullContext}\n\nQuestion : ${query}`,
        },
      ];

      // Appeler l'API OpenAI
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages as any,
        temperature: 0.3,
        max_tokens: 1000,
      });

      const responseText =
        completion.choices[0].message.content ||
        "Je n'ai pas pu générer de réponse.";

      // Retourner la réponse avec les sources
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

  // Détecter si la requête est liée au temps (planning, agenda, etc.)
  private isTimeRelatedQuery(query: string): boolean {
    const timeRelatedKeywords = [
      'semaine',
      'prochaine',
      'demain',
      'aujourd',
      'planning',
      'agenda',
      'calendrier',
      'rendez-vous',
      'événement',
      'evenement',
      'rdv',
      'chantier',
      'visite',
      'programme',
      'prévu',
      'date',
    ];

    const lowerQuery = query.toLowerCase();
    return timeRelatedKeywords.some((keyword) => lowerQuery.includes(keyword));
  }

  // Détecter si la requête concerne l'état des projets
  private isProjectStatusQuery(query: string): boolean {
    const projectStatusKeywords = [
      'projet',
      'actif',
      'actuel',
      'en cours',
      'actifs',
      'actuels',
      'chantier',
      'travaux',
      'avancement',
      'état',
      'etat',
      'status',
      'statut',
      'progression',
    ];

    const lowerQuery = query.toLowerCase();
    return projectStatusKeywords.some((keyword) =>
      lowerQuery.includes(keyword),
    );
  }

  // Extraire la période temporelle mentionnée (semaine prochaine, mois prochain, etc.)
  private extractTimeframe(query: string): { start: Date; end: Date } {
    const now = new Date();
    const lowerQuery = query.toLowerCase();

    // Semaine prochaine
    if (lowerQuery.includes('semaine prochaine')) {
      const nextWeekStart = new Date(now);
      nextWeekStart.setDate(now.getDate() - now.getDay() + 8); // Lundi prochain
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6); // Dimanche prochain
      return { start: nextWeekStart, end: nextWeekEnd };
    }

    // Demain
    if (lowerQuery.includes('demain')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);
      return { start: tomorrow, end: tomorrowEnd };
    }

    // Aujourd'hui
    if (lowerQuery.includes('aujourd') || lowerQuery.includes('ce jour')) {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      return { start: today, end: todayEnd };
    }

    // Cette semaine
    if (lowerQuery.includes('cette semaine')) {
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - now.getDay() + 1); // Lundi de cette semaine
      thisWeekStart.setHours(0, 0, 0, 0);
      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setDate(thisWeekStart.getDate() + 6); // Dimanche de cette semaine
      thisWeekEnd.setHours(23, 59, 59, 999);
      return { start: thisWeekStart, end: thisWeekEnd };
    }

    // Par défaut, considérer les 7 prochains jours
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);
    return { start: weekStart, end: weekEnd };
  }

  // Récupérer les événements à venir basés sur une période
  private async getUpcomingEvents(timeframe: {
    start: Date;
    end: Date;
  }): Promise<any[]> {
    try {
      this.logger.log(
        `Recherche d'événements entre ${timeframe.start.toISOString()} et ${timeframe.end.toISOString()}`,
      );

      const events = await this.prisma.events.findMany({
        where: {
          OR: [
            {
              // Événements qui commencent pendant la période
              start_date: {
                gte: timeframe.start,
                lte: timeframe.end,
              },
            },
            {
              // Événements qui terminent pendant la période
              end_date: {
                gte: timeframe.start,
                lte: timeframe.end,
              },
            },
            {
              // Événements qui englobent toute la période
              AND: [
                { start_date: { lte: timeframe.start } },
                { end_date: { gte: timeframe.end } },
              ],
            },
          ],
        },
        include: {
          projects: true,
          staff: true,
          clients: true,
        },
        orderBy: {
          start_date: 'asc',
        },
      });

      this.logger.log(
        `${events.length} événements trouvés pour la période spécifiée`,
      );
      return events;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des événements: ${error.message}`,
      );
      return [];
    }
  }

  // Récupérer les projets actifs (en cours)
  private async getActiveProjects(): Promise<any[]> {
    try {
      const activeProjects = await this.prisma.projects.findMany({
        where: {
          OR: [
            { status: 'en cours' },
            { status: 'En cours' },
            { status: 'ACTIF' },
            { status: 'actif' },
            { status: 'Actif' },
            // Projet qui a une date de début mais pas de date de fin
            {
              AND: [
                { start_date: { not: null } },
                {
                  OR: [{ end_date: null }, { end_date: { gt: new Date() } }],
                },
              ],
            },
          ],
        },
        include: {
          clients: true,
          project_stages: {
            orderBy: {
              order_index: 'asc',
            },
          },
          project_staff: {
            include: {
              staff: true,
            },
          },
        },
        orderBy: {
          start_date: 'desc',
        },
        take: 20, // Limiter aux 20 projets les plus récents
      });

      this.logger.log(`${activeProjects.length} projets actifs trouvés`);
      return activeProjects;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des projets actifs: ${error.message}`,
      );
      return [];
    }
  }

  // Formater les événements à venir pour le contexte
  private formatUpcomingEvents(events: any[]): string {
    if (events.length === 0) return '';

    const eventsText = events
      .map((event) => {
        const startDate = event.start_date ? new Date(event.start_date) : null;
        const endDate = event.end_date ? new Date(event.end_date) : null;

        const formatDate = (date: Date) => {
          return date.toLocaleString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          });
        };

        return `
Événement: ${event.title}
Type: ${event.event_type || 'Non spécifié'}
Description: ${event.description || 'Non spécifiée'}
Date de début: ${startDate ? formatDate(startDate) : 'Non spécifiée'}
Date de fin: ${endDate ? formatDate(endDate) : 'Non spécifiée'}
Journée entière: ${event.all_day ? 'Oui' : 'Non'}
Lieu: ${event.location || 'Non spécifié'}
Projet: ${event.projects?.name || 'Non spécifié'}
Personnel impliqué: ${event.staff ? `${event.staff.firstname} ${event.staff.lastname}` : 'Non spécifié'}
Client: ${event.clients ? event.clients.company_name || `${event.clients.firstname} ${event.clients.lastname}` : 'Non spécifié'}
Statut: ${event.status || 'Non spécifié'}
`;
      })
      .join('\n---\n');

    return `ÉVÉNEMENTS À VENIR:\n\n${eventsText}`;
  }

  // Formater les projets actifs pour le contexte
  private formatActiveProjects(projects: any[]): string {
    if (projects.length === 0) return '';

    const projectsText = projects
      .map((project) => {
        const startDate = project.start_date
          ? new Date(project.start_date)
          : null;
        const endDate = project.end_date ? new Date(project.end_date) : null;

        const formatDate = (date: Date) => {
          return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        };

        // Calculer l'avancement global
        let completionPercentage = 0;
        if (project.project_stages && project.project_stages.length > 0) {
          const totalStages = project.project_stages.length;
          const totalCompletion = project.project_stages.reduce(
            (sum, stage) => sum + (stage.completion_percentage || 0),
            0,
          );
          completionPercentage = Math.round(totalCompletion / totalStages);
        }

        // Obtenir les membres du personnel assignés
        const assignedStaff = project.project_staff
          ? project.project_staff
              .map((ps) =>
                ps.staff ? `${ps.staff.firstname} ${ps.staff.lastname}` : null,
              )
              .filter(Boolean)
              .join(', ')
          : 'Aucun';

        return `
Projet: ${project.name}
Référence: ${project.reference || 'Non spécifiée'}
Description: ${project.description || 'Non spécifiée'}
Client: ${project.clients ? project.clients.company_name || `${project.clients.firstname} ${project.clients.lastname}` : 'Non spécifié'}
Statut: ${project.status || 'En cours'}
Date de début: ${startDate ? formatDate(startDate) : 'Non spécifiée'}
Date de fin prévue: ${endDate ? formatDate(endDate) : 'Non spécifiée'}
Avancement global: ${completionPercentage}%
Personnel assigné: ${assignedStaff}
Étapes actives: ${
          project.project_stages
            ? project.project_stages
                .filter(
                  (stage) =>
                    stage.status === 'En cours' ||
                    stage.status === 'en cours' ||
                    stage.status === 'ACTIF',
                )
                .map((stage) => stage.name)
                .join(', ') || 'Aucune'
            : 'Aucune'
        }
`;
      })
      .join('\n---\n');

    return `PROJETS ACTIFS:\n\n${projectsText}`;
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

        case 'events':
          return await this.prisma.events.findUnique({
            where: { id: sourceId },
            include: {
              projects: true,
              staff: true,
              clients: true,
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
