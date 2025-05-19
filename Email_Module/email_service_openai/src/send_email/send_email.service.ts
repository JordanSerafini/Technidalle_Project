import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  AnalyzeEmailService,
  EmailContent,
} from '../analyze_email/analyze_email.service';

// URL de base pour les appels API internes
const API_URL = 'http://localhost:4444';

// Ajout des interfaces pour le cache
interface CachedEmails {
  timestamp: number;
  emails: EmailContent[];
}

interface CachedResponse {
  timestamp: number;
  data: {
    originalEmail: EmailContent;
    draftResponse:
      | string
      | {
          response: string;
          tokensUsed: { input: number; output: number; total: number };
        };
  };
}

@Injectable()
export class SendEmailService {
  private readonly logger = new Logger(SendEmailService.name);
  private transporter: nodemailer.Transporter;

  // Cache en mémoire
  private emailsCache: Record<string, CachedEmails> = {}; // clé: mailbox
  private responsesCache: Record<string, CachedResponse> = {}; // clé: emailId_responseLength
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes en millisecondes

  constructor(
    private configService: ConfigService,
    private analyzeEmailService: AnalyzeEmailService,
  ) {
    // Configuration du transporteur SMTP
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });

    this.logger.log("Service d'envoi d'emails initialisé");
  }

  /**
   * Récupère un email spécifique par son ID
   * @param mailbox Boîte mail à analyser
   * @param emailId ID de l'email à récupérer
   * @param forceRefresh Force l'actualisation des données au lieu d'utiliser le cache
   */
  async getEmailById(
    mailbox: string,
    emailId: string,
    forceRefresh: boolean = false,
  ): Promise<EmailContent | null> {
    try {
      // Récupérer tous les emails du jour en tenant compte du cache
      const emails = await this.getAllTodayEmails(mailbox, forceRefresh);

      // Rechercher l'email par ID ou UID IMAP
      const email = emails.find(
        (e) =>
          e.id === emailId ||
          e.imapUID === emailId ||
          (e.folderPath === mailbox &&
            (e.id === emailId || e.imapUID === emailId)),
      );

      if (!email) {
        this.logger.warn(`Email avec ID ${emailId} non trouvé dans ${mailbox}`);
        return null;
      }

      return email;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération de l'email: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Récupère tous les emails d'aujourd'hui avec gestion du cache
   * @param mailbox Boîte mail à analyser
   * @param forceRefresh Force l'actualisation des données au lieu d'utiliser le cache
   */
  private async getAllTodayEmails(
    mailbox: string = 'INBOX',
    forceRefresh: boolean = false,
  ): Promise<EmailContent[]> {
    const cacheKey = mailbox;
    const now = Date.now();
    const cachedData = this.emailsCache[cacheKey];

    // Utiliser le cache si disponible et pas périmé, sauf si forceRefresh est vrai
    if (
      !forceRefresh &&
      cachedData &&
      now - cachedData.timestamp < this.CACHE_TTL
    ) {
      this.logger.log(
        `[CACHE] Utilisation du cache pour les emails de ${mailbox}`,
      );
      return cachedData.emails;
    }

    // Sinon, récupérer les emails
    this.logger.log(`[API] Récupération des emails de ${mailbox} depuis l'API`);
    const emails = await this.analyzeEmailService.getAllTodayEmails();

    // Stocker dans le cache
    this.emailsCache[cacheKey] = {
      timestamp: now,
      emails,
    };

    return emails;
  }

  /**
   * Génère une réponse automatique à un email
   * @param mailbox Boîte mail contenant l'email
   * @param emailId ID de l'email à répondre
   * @param responseLength Niveau de détail de la réponse ('court', 'normal', 'détaillé')
   * @param forceRefresh Force l'actualisation des données au lieu d'utiliser le cache
   */
  async generateResponseForEmail(
    mailbox: string,
    emailId: string,
    responseLength: 'court' | 'normal' | 'détaillé' = 'normal',
    forceRefresh: boolean = false,
  ): Promise<{
    originalEmail: EmailContent | null;
    draftResponse:
      | string
      | {
          response: string;
          tokensUsed: { input: number; output: number; total: number };
        };
  }> {
    try {
      // Vérifier le cache pour la réponse si forceRefresh est faux
      const cacheKey = `${emailId}_${responseLength}`;
      const now = Date.now();
      const cachedResponse = this.responsesCache[cacheKey];

      if (
        !forceRefresh &&
        cachedResponse &&
        now - cachedResponse.timestamp < this.CACHE_TTL
      ) {
        this.logger.log(
          `[CACHE] Utilisation de la réponse en cache pour l'email ${emailId} (${responseLength})`,
        );
        return {
          originalEmail: cachedResponse.data.originalEmail,
          draftResponse: cachedResponse.data.draftResponse,
        };
      }

      // Récupérer l'email original
      const email = await this.getEmailById(mailbox, emailId, forceRefresh);

      if (!email) {
        return {
          originalEmail: null,
          draftResponse: 'Email non trouvé',
        };
      }

      // Analyser l'email s'il n'a pas encore été analysé
      const analyzedEmail = email.analysis
        ? email
        : (await this.analyzeEmailService.analyzeEmails([email]))[0];

      // Générer une réponse automatique avec la longueur spécifiée
      const draftResponse =
        await this.analyzeEmailService.generateEmailResponse(
          analyzedEmail,
          responseLength,
        );

      this.logger.log(
        `[API] Réponse ${responseLength} générée pour l'email ${emailId}`,
      );

      // Stocker dans le cache
      this.responsesCache[cacheKey] = {
        timestamp: now,
        data: {
          originalEmail: analyzedEmail,
          draftResponse,
        },
      };

      return {
        originalEmail: analyzedEmail,
        draftResponse,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la génération de la réponse: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Reformule une réponse à un email selon des instructions spécifiques
   * @param mailbox Boîte mail contenant l'email
   * @param emailId ID de l'email à répondre
   * @param draftResponse Brouillon de réponse à reformuler
   * @param instructions Instructions pour la reformulation
   */
  async rewriteResponse(
    mailbox: string,
    emailId: string,
    draftResponse: string,
    instructions: string,
  ): Promise<
    | string
    | {
        response: string;
        tokensUsed: { input: number; output: number; total: number };
      }
  > {
    try {
      // Récupérer l'email original
      const email = await this.getEmailById(mailbox, emailId);

      if (!email) {
        return 'Email non trouvé. Impossible de reformuler la réponse.';
      }

      // Reformuler la réponse
      const rewrittenResponse =
        await this.analyzeEmailService.rewriteEmailResponse(
          email,
          draftResponse,
          instructions,
        );

      return rewrittenResponse;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la reformulation de la réponse: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Envoie une réponse à un email
   * @param mailbox Boîte mail contenant l'email original
   * @param emailId ID de l'email auquel répondre
   * @param responseText Texte de la réponse à envoyer
   * @param customSubject Objet personnalisé (si vide, utilisera Re: + objet original)
   */
  async sendEmailResponse(
    mailbox: string,
    emailId: string,
    responseText: string,
    customSubject?: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Récupérer l'email original
      const originalEmail = await this.getEmailById(mailbox, emailId);

      if (!originalEmail) {
        return {
          success: false,
          message:
            "Email original non trouvé. Impossible d'envoyer la réponse.",
        };
      }

      // Préparer les détails de l'email
      const from = this.configService.get<string>('EMAIL_USER') || '';
      const to = originalEmail.from.replace(/.*<(.*)>.*/, '$1'); // Extraire l'adresse email
      const subject = customSubject || `Re: ${originalEmail.subject}`;

      // Envoyer l'email
      const info = (await this.transporter.sendMail({
        from,
        to,
        subject,
        text: responseText,
      })) as { messageId?: string };

      this.logger.log(
        `Réponse envoyée: ${info?.messageId || 'Message envoyé'}`,
      );

      return {
        success: true,
        message: `Réponse envoyée avec succès à ${to}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`Erreur lors de l'envoi de l'email: ${errorMessage}`);

      return {
        success: false,
        message: `Erreur lors de l'envoi: ${errorMessage}`,
      };
    }
  }

  /**
   * Liste les emails qui nécessitent une réponse
   * @param mailbox Boîte mail à analyser (INBOX par défaut)
   * @param _daysBack Nombre de jours à considérer (pour inclure des emails plus anciens)
   * @param forceRefresh Force l'actualisation des données au lieu d'utiliser le cache
   */
  async listEmailsRequiringResponse(
    mailbox: string = 'INBOX',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _daysBack: number = 7, // Paramètre prévu pour utilisation future
    forceRefresh: boolean = false,
  ): Promise<EmailContent[]> {
    try {
      // Récupérer tous les emails récents (avec cache)
      const allEmails = await this.getAllTodayEmails(mailbox, forceRefresh);

      // Filtrer par boîte mail si spécifiée (autre que INBOX)
      const filteredEmails =
        mailbox !== 'INBOX'
          ? allEmails.filter((email) => {
              // Préparation pour future implémentation avec _daysBack
              return email.folderPath === mailbox;
            })
          : allEmails;

      // Analyser les emails qui n'ont pas encore été analysés
      const emailsToAnalyze = filteredEmails.filter((email) => !email.analysis);
      if (emailsToAnalyze.length > 0) {
        await this.analyzeEmailService.analyzeEmails(emailsToAnalyze);
      }

      // Maintenant tous les emails ont une analyse
      const analyzedEmails = [...filteredEmails];

      // Filtrer les emails qui nécessitent une réponse
      const emailsRequiringResponse = analyzedEmails.filter((email) => {
        // Vérifier si l'email nécessite une action
        if (!email.analysis || !email.analysis.actionRequired) {
          return false;
        }

        // Vérifier si une des actions suggérées est de répondre à l'email
        return (
          email.analysis.actionItems?.some(
            (item) =>
              item.toLowerCase().includes('répondre') ||
              item.toLowerCase().includes('repondre'),
          ) || false
        );
      });

      return emailsRequiringResponse;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des emails nécessitant une réponse: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Vide le cache des emails et des réponses
   */
  clearCache(): void {
    this.emailsCache = {};
    this.responsesCache = {};
    this.logger.log('Cache vidé avec succès');
  }

  /**
   * Génère une réponse automatique à un email (méthode optimisée)
   * Cette version utilise un appel API direct pour récupérer l'email par ID
   * au lieu de charger tous les emails
   * @param mailbox Boîte mail contenant l'email
   * @param emailId ID de l'email à répondre
   * @param responseLength Niveau de détail de la réponse ('court', 'normal', 'détaillé')
   * @param forceRefresh Force l'actualisation des données au lieu d'utiliser le cache
   */
  async generateOptimizedResponseForEmail(
    mailbox: string,
    emailId: string,
    responseLength: 'court' | 'normal' | 'détaillé' = 'normal',
    forceRefresh: boolean = false,
  ): Promise<{
    originalEmail: EmailContent | null;
    draftResponse:
      | string
      | {
          response: string;
          tokensUsed: { input: number; output: number; total: number };
        };
  }> {
    try {
      // Vérifier le cache pour la réponse si forceRefresh est faux
      const cacheKey = `${emailId}_${responseLength}`;
      const now = Date.now();
      const cachedResponse = this.responsesCache[cacheKey];

      if (
        !forceRefresh &&
        cachedResponse &&
        now - cachedResponse.timestamp < this.CACHE_TTL
      ) {
        this.logger.log(
          `[CACHE] Utilisation de la réponse en cache pour l'email ${emailId} (${responseLength})`,
        );
        return {
          originalEmail: cachedResponse.data.originalEmail,
          draftResponse: cachedResponse.data.draftResponse,
        };
      }

      // Faire une requête au service analyze_email pour récupérer l'email par son ID
      try {
        // Utiliser un fetch HTTP à l'endpoint /analyze-email/get-email/:emailId
        // Toujours passer forceRefresh=false à l'API interne pour éviter de recharger tous les emails
        const apiUrl = `${API_URL}/analyze-email/get-email/${emailId}?mailbox=${mailbox}&forceRefresh=false`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(
            `Erreur lors de la récupération de l'email: ${response.status}`,
          );
        }

        const result = (await response.json()) as {
          status: string;
          message: string;
          data: EmailContent;
        };

        if (result.status !== 'success' || !result.data) {
          throw new Error(result.message || 'Email non trouvé');
        }

        const email = result.data;

        // Analyser l'email s'il n'a pas encore été analysé
        const analyzedEmail = email.analysis
          ? email
          : (await this.analyzeEmailService.analyzeEmails([email]))[0];

        // Générer une réponse automatique avec la longueur spécifiée
        const draftResponse =
          await this.analyzeEmailService.generateEmailResponse(
            analyzedEmail,
            responseLength,
          );

        this.logger.log(
          `[API] Réponse ${responseLength} générée pour l'email ${emailId}`,
        );

        // Stocker dans le cache
        this.responsesCache[cacheKey] = {
          timestamp: now,
          data: {
            originalEmail: analyzedEmail,
            draftResponse,
          },
        };

        return {
          originalEmail: analyzedEmail,
          draftResponse,
        };
      } catch (error) {
        // Si l'appel à l'API échoue, au lieu de revenir à la méthode classique qui recharge tous les emails,
        // rechercher l'email dans le cache existant des emails sans forcer le rechargement
        this.logger.warn(
          `Échec de récupération optimisée pour l'email ${emailId}, recherche dans le cache: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );

        // Utiliser la méthode getEmailById avec forceRefresh=false pour chercher dans le cache
        const email = await this.getEmailById(mailbox, emailId, false);

        if (!email) {
          return {
            originalEmail: null,
            draftResponse: `Email avec ID ${emailId} non trouvé. Veuillez rafraîchir la liste des emails.`,
          };
        }

        // Analyser l'email si nécessaire
        const analyzedEmail = email.analysis
          ? email
          : (await this.analyzeEmailService.analyzeEmails([email]))[0];

        // Générer la réponse
        const draftResponse =
          await this.analyzeEmailService.generateEmailResponse(
            analyzedEmail,
            responseLength,
          );

        // Stocker dans le cache
        this.responsesCache[cacheKey] = {
          timestamp: now,
          data: {
            originalEmail: analyzedEmail,
            draftResponse,
          },
        };

        return {
          originalEmail: analyzedEmail,
          draftResponse,
        };
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de la génération de la réponse: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }
}
