import { Injectable } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { DatabaseService } from './database.service';
import { EnhancedPromptsService } from './enhanced-prompts.service';
import { ConversationContextService } from './conversation-context.service';
import { ResponseFormatterService } from './response-formatter.service';
import { ChatRequest, ChatResponse } from './dto/chat.dto';
import { v4 as uuidv4 } from 'uuid';

interface ConversationContext {
  id: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  database: 'sync' | 'app';
}

@Injectable()
export class ChatbotService {
  private conversations = new Map<string, ConversationContext>();

  constructor(
    private openaiService: OpenaiService,
    private databaseService: DatabaseService,
    private enhancedPromptsService: EnhancedPromptsService,
    private conversationContextService: ConversationContextService,
    private responseFormatterService: ResponseFormatterService,
  ) {}

  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const conversationId = request.conversationId || uuidv4();
    const startTime = Date.now();
    
    // Créer ou récupérer la session de conversation
    let session = this.conversationContextService.getSession(conversationId);
    if (!session) {
      session = this.conversationContextService.createSession(request.userId || 'anonymous', conversationId);
    }

    // Détecter le type de question et suggérer la base de données
    const queryType = this.enhancedPromptsService.detectQuestionType(request.message);
    const suggestedDatabase = this.enhancedPromptsService.suggestDatabase(request.message);
    const activeDatabase = request.database || suggestedDatabase;

    // Ajouter le message utilisateur au contexte
    this.conversationContextService.addMessage(conversationId, 'user', request.message, {
      queryType,
      database: activeDatabase
    });

    // Récupérer le contexte de conversation
    const contextInfo = this.conversationContextService.getContextualInfo(conversationId);

    // Maintenir la compatibilité avec l'ancien système
    let conversation = this.conversations.get(conversationId);
    if (!conversation) {
      conversation = {
        id: conversationId,
        messages: [
          {
            role: 'system',
            content: this.enhancedPromptsService.getBusinessPrompt(),
          },
        ],
        database: activeDatabase,
      };
      this.conversations.set(conversationId, conversation);
    }

    // Mettre à jour la base de données si spécifiée
    if (request.database) {
      conversation.database = request.database;
    }

    // Ajouter le message de l'utilisateur
    conversation.messages.push({
      role: 'user',
      content: request.message + (contextInfo ? `\n\nCONTEXTE:\n${contextInfo}` : ''),
    });

    try {
      // Analyser la demande pour déterminer si c'est une question sur les données
      const response = await this.handleUserQuery(conversation, request.message);
      
      // Ajouter la réponse de l'assistant
      conversation.messages.push({
        role: 'assistant',
        content: response,
      });

      return {
        message: response,
        conversationId,
        timestamp: new Date(),
        database: conversation.database,
      };
    } catch (error) {
      console.error('Erreur lors du traitement du message:', error);
      const errorMessage = 'Désolé, une erreur s\'est produite lors du traitement de votre demande. Pouvez-vous reformuler votre question ?';
      
      conversation.messages.push({
        role: 'assistant',
        content: errorMessage,
      });

      return {
        message: errorMessage,
        conversationId,
        timestamp: new Date(),
        database: conversation.database,
      };
    }
  }

  private async handleUserQuery(conversation: ConversationContext, userMessage: string): Promise<string> {
    const lowerMessage = userMessage.toLowerCase();

    // Gestion des commandes spéciales en priorité
    if (lowerMessage.includes('liste') && lowerMessage.includes('table')) {
      return await this.listTables(conversation.database);
    }

    if (lowerMessage.includes('schéma') || lowerMessage.includes('schema') || lowerMessage.includes('structure')) {
      return await this.getSchema(conversation.database);
    }

    if (lowerMessage.includes('aide') || lowerMessage.includes('help') || lowerMessage.includes('commande')) {
      return this.getHelpMessage();
    }

    // Vérifier si c'est une question nécessitant une requête SQL (priorité haute)
    if (this.needsDatabaseQuery(userMessage)) {
      // Détecter quelle base utiliser dans le contexte de la question
      if (lowerMessage.includes('base app') || lowerMessage.includes('database app') || lowerMessage.includes('db app') || lowerMessage.includes('dans la base app')) {
        conversation.database = 'app';
      } else if (lowerMessage.includes('base sync') || lowerMessage.includes('database sync') || lowerMessage.includes('db sync') || lowerMessage.includes('dans la base sync')) {
        conversation.database = 'sync';
      }
      
      // Vérifier la connexion à la base de données
      if (!this.databaseService.isConnected(conversation.database)) {
        return `Désolé, la base de données "${conversation.database}" n'est pas disponible actuellement. Veuillez vérifier la configuration ou essayer l'autre base de données.`;
      }
      
      return await this.handleDatabaseQuery(conversation, userMessage);
    }

    // Déterminer la base de données à utiliser (seulement si ce n'est pas une question de données)
    if (lowerMessage === 'base app' || lowerMessage === 'database app' || lowerMessage === 'db app') {
      conversation.database = 'app';
      return `Parfait ! Je vais maintenant utiliser la base de données "app". Que souhaitez-vous savoir ?`;
    } else if (lowerMessage === 'base sync' || lowerMessage === 'database sync' || lowerMessage === 'db sync') {
      conversation.database = 'sync';
      return `Parfait ! Je vais maintenant utiliser la base de données "sync". Que souhaitez-vous savoir ?`;
    }

    // Vérifier la connexion à la base de données
    if (!this.databaseService.isConnected(conversation.database)) {
      return `Désolé, la base de données "${conversation.database}" n'est pas disponible actuellement. Veuillez vérifier la configuration ou essayer l'autre base de données.`;
    }

    // Réponse générale avec OpenAI
    return await this.openaiService.generateResponse(conversation.messages);
  }

  private needsDatabaseQuery(message: string): boolean {
    const queryKeywords = [
      'combien', 'nombre', 'count', 'liste', 'affiche', 'montre', 'trouve',
      'recherche', 'select', 'où', 'when', 'quand', 'données', 'data',
      'statistique', 'moyenne', 'maximum', 'minimum', 'total', 'somme',
      'derniers', 'premiers', 'récents', 'quel', 'quels', 'quelle', 'quelles',
      'chantiers', 'projets', 'clients', 'véhicules', 'tâches', 'retard', 
      'en cours', 'terminé', 'fini', 'avancement', 'état', 'statut', 'qui',
      'travail', 'travaille', 'employé', 'staff', 'équipe', 'congé', 'absence',
      'disponible', 'occupé', 'libre', 'semaine', 'prochaine', 'planning'
    ];

    return queryKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private async handleDatabaseQuery(conversation: ConversationContext, userMessage: string): Promise<string> {
    const startTime = Date.now();
    const conversationId = conversation.id;
    let success = false;
    let queryType = 'general';

    try {
      // Détecter le type de question pour un meilleur prompt
      queryType = this.enhancedPromptsService.detectQuestionType(userMessage);
      
      // NOUVELLE ÉTAPE : Analyser la question avec l'IA pour clarifier l'intention
      const questionAnalysis = await this.analyzeQuestionWithAI(userMessage, conversation.database);
      
      if (questionAnalysis.error) {
        const errorResponse = this.responseFormatterService.formatError(
          `Je n'ai pas pu comprendre votre question: ${questionAnalysis.error}`,
          'Essayez de reformuler avec des termes plus précis.'
        );
        return errorResponse.text;
      }

      // ESSAYER D'ABORD UNE REQUÊTE PRÉDÉFINIE
      const predefinedQuery = this.getPredefinedQuery(userMessage, questionAnalysis, conversation.database);
      
      let sqlQuery: string;
      
      if (predefinedQuery) {
        console.log('Utilisation d\'une requête prédéfinie:', predefinedQuery);
        sqlQuery = predefinedQuery;
      } else {
        // Fallback : Obtenir le schéma de la base de données
        const schema = await this.databaseService.getTableSchema(conversation.database);

        // Générer un prompt contextuel amélioré avec l'analyse
        const contextualPrompt = this.enhancedPromptsService.generateContextualPrompt(
          questionAnalysis.clarifiedQuestion || userMessage, 
          schema
        );

        // Générer la requête SQL avec le prompt amélioré
        sqlQuery = await this.openaiService.generateSqlQueryWithPrompt(contextualPrompt, questionAnalysis.clarifiedQuestion || userMessage);
      }

      if (sqlQuery.startsWith('ERREUR:')) {
        const errorResponse = this.responseFormatterService.formatError(
          `Je n'ai pas pu comprendre votre question: ${sqlQuery}`,
          'Essayez de reformuler avec des termes plus précis ou donnez plus de contexte.'
        );
        return errorResponse.text;
      }

      // Nettoyer la requête SQL
      console.log('🔍 SQL avant nettoyage:', sqlQuery);
      const cleanQuery = this.cleanSqlQuery(sqlQuery);
      console.log('🔍 SQL après nettoyage:', cleanQuery);

      if (!cleanQuery) {
        console.log('❌ Requête SQL vide après nettoyage');
        const errorResponse = this.responseFormatterService.formatError(
          'Je n\'ai pas pu générer une requête SQL valide',
          'Pouvez-vous reformuler votre question plus clairement ?'
        );
        return errorResponse.text;
      }

      // Exécuter la requête
      const result = await this.databaseService.executeQuery(cleanQuery, conversation.database, 100);
      success = true;

      // Utiliser le nouveau service de formatage
      const formattedResponse = this.responseFormatterService.formatResponse(
        queryType,
        result.rows || [],
        userMessage
      );

      // Ajouter des informations techniques en bas
      let finalResponse = formattedResponse.text;
      
      if (formattedResponse.suggestions && formattedResponse.suggestions.length > 0) {
        finalResponse += `\n\n**💡 Suggestions :**\n`;
        formattedResponse.suggestions.forEach((suggestion, index) => {
          finalResponse += `${index + 1}. ${suggestion}\n`;
        });
      }

      finalResponse += `\n\n---\n*🔍 Requête SQL:* \`${cleanQuery}\`\n*💾 Base:* ${conversation.database}\n*⏱️ Temps:* ${Date.now() - startTime}ms`;

      // Enregistrer dans le contexte si disponible
      if (this.conversationContextService && conversationId) {
        this.conversationContextService.addMessage(conversationId, 'assistant', finalResponse, {
          queryType,
          database: conversation.database,
          sqlQuery: cleanQuery,
          responseTime: Date.now() - startTime,
          success: true
        });
      }

      return finalResponse;

    } catch (error) {
      console.error('Erreur lors de la requête:', error);
      
      // Enregistrer l'erreur dans le contexte
      if (this.conversationContextService && conversationId) {
        this.conversationContextService.addMessage(conversationId, 'assistant', error.message, {
          queryType,
          database: conversation.database,
          responseTime: Date.now() - startTime,
          success: false
        });
      }

      const errorResponse = this.responseFormatterService.formatError(
        `Erreur lors de l'exécution: ${error.message}`,
        'Vérifiez votre question ou contactez l\'administrateur si le problème persiste.'
      );
      
      return errorResponse.text;
    }
  }

  private cleanSqlQuery(query: string): string {
    // Supprimer les backticks et autres formatages
    let cleanQuery = query.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Si la réponse contient du texte explicatif, extraire seulement la partie SQL
    const lines = cleanQuery.split('\n');
    let sqlLines: string[] = [];
    let inSqlBlock = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim().toLowerCase();
      
      // Détecter le début d'une requête SQL
      if (trimmedLine.startsWith('select') || trimmedLine.startsWith('with')) {
        inSqlBlock = true;
        sqlLines.push(line);
      } 
      // Si on est dans un bloc SQL, continuer à collecter les lignes
      else if (inSqlBlock) {
        // Arrêter si on trouve une ligne qui ne fait clairement pas partie du SQL
        if (trimmedLine.includes('cette requête') || 
            trimmedLine.includes('pour') && !trimmedLine.includes('from') ||
            trimmedLine.includes('résultat') ||
            trimmedLine.startsWith('note:') ||
            trimmedLine.startsWith('explication:')) {
          break;
        }
        sqlLines.push(line);
      }
    }
    
    if (sqlLines.length > 0) {
      cleanQuery = sqlLines.join('\n').trim();
    }
    
    // Vérifier que c'est bien une requête SELECT
    if (!cleanQuery.toLowerCase().startsWith('select') && !cleanQuery.toLowerCase().startsWith('with')) {
      console.log('❌ Pas de requête SELECT trouvée dans:', query.substring(0, 200));
      return '';
    }

    // Supprimer les points-virgules finaux
    cleanQuery = cleanQuery.replace(/;+$/, '');

    return cleanQuery;
  }

  private formatQueryResult(result: any, originalQuestion: string, sqlQuery: string): string {
    if (!result || !result.rows || result.rows.length === 0) {
      return `Aucun résultat trouvé pour votre question: "${originalQuestion}"`;
    }

    let response = `**Réponse à votre question:** "${originalQuestion}"\n\n`;
    
    if (result.rows.length === 1 && Object.keys(result.rows[0]).length === 1) {
      // Résultat simple (ex: count)
      const value = Object.values(result.rows[0])[0];
      response += `**Résultat:** ${value}\n\n`;
    } else {
      // Résultats multiples - formatage spécialisé selon le type de données
      response += `**${result.rows.length} résultat(s) trouvé(s):**\n\n`;
      
      // Limiter l'affichage à 10 résultats pour la lisibilité
      const rowsToShow = result.rows.slice(0, 10);
      
      // Formatage spécialisé pour les projets
      if (this.isProjectQuery(sqlQuery)) {
        response += this.formatProjectResults(rowsToShow);
      } else if (this.isListQuery(originalQuestion)) {
        // Formatage simple pour les listes
        response += this.formatListResults(rowsToShow);
      } else {
        // Formatage générique pour autres types
        response += this.formatGenericResults(rowsToShow);
      }

      if (result.rows.length > 10) {
        response += `\n... et ${result.rows.length - 10} autres résultats.\n`;
      }
    }

    response += `\n\n---\n*Requête SQL:* \`${sqlQuery}\`\n*Base de données:* ${result.database}`;

    return response;
  }

  private isProjectQuery(sqlQuery: string): boolean {
    return sqlQuery.toLowerCase().includes('from projects') || sqlQuery.toLowerCase().includes('projects.');
  }

  private isListQuery(question: string): boolean {
    return question.toLowerCase().includes('liste') || question.toLowerCase().includes('combien');
  }

  private formatProjectResults(rows: any[]): string {
    let output = '';
    
    rows.forEach((project: any, index: number) => {
      output += `**${index + 1}. ${project.name || 'Projet sans nom'}**\n`;
      output += `   📋 Référence: ${project.reference || 'N/A'}\n`;
      output += `   📊 Statut: ${this.translateStatus(project.status)}\n`;
      
      if (project.client_id) {
        output += `   👤 Client ID: ${project.client_id}\n`;
      }
      
      if (project.start_date) {
        const startDate = new Date(project.start_date).toLocaleDateString('fr-FR');
        output += `   📅 Date début: ${startDate}\n`;
      }
      
      if (project.end_date) {
        const endDate = new Date(project.end_date).toLocaleDateString('fr-FR');
        const isLate = new Date(project.end_date) < new Date();
        output += `   🎯 Date fin: ${endDate}${isLate ? ' ⚠️ **EN RETARD**' : ''}\n`;
      }
      
      if (project.budget && project.budget > 0) {
        output += `   💰 Budget: ${project.budget}€\n`;
      }
      
      if (project.actual_cost && project.actual_cost > 0) {
        output += `   💸 Coût réel: ${project.actual_cost}€\n`;
      }
      
      output += '\n';
    });
    
    return output;
  }

  private formatListResults(rows: any[]): string {
    let output = '';
    
    rows.forEach((row: any, index: number) => {
      output += `${index + 1}. `;
      
      // Toujours afficher l'ID en premier s'il existe
      const idField = Object.keys(row).find(key => key.toLowerCase() === 'id' || key.endsWith('_id'));
      if (idField && row[idField]) {
        output += `[ID: ${row[idField]}] `;
      }
      
      // Afficher les colonnes les plus importantes en premier
      const importantFields = ['name', 'reference', 'firstname', 'lastname', 'company_name'];
      const displayedFields = new Set([idField]);
      
      // Afficher les champs importants
      importantFields.forEach(field => {
        if (row[field] && !displayedFields.has(field)) {
          output += `${row[field]} `;
          displayedFields.add(field);
        }
      });
      
      // Afficher les autres champs courts
      Object.entries(row).forEach(([key, value]) => {
        if (!displayedFields.has(key) && value && typeof value === 'string' && value.length < 50) {
          output += `(${key}: ${value}) `;
        }
      });
      
      output += '\n';
    });
    
    return output;
  }

  private formatGenericResults(rows: any[]): string {
    let output = '';
    
    if (rows.length <= 3) {
      // Affichage détaillé pour peu de résultats
      rows.forEach((row: any, index: number) => {
        output += `**${index + 1}.** `;
        Object.entries(row).forEach(([key, value]) => {
          if (this.shouldDisplayField(key, value)) {
            output += `${key}: ${this.formatFieldValue(value)} | `;
          }
        });
        output = output.slice(0, -3) + '\n';
      });
    } else {
      // Affichage tabulaire pour plus de résultats
      const importantColumns = this.getImportantColumns(rows[0]);
      output += `| ${importantColumns.join(' | ')} |\n`;
      output += `|${importantColumns.map(() => '---').join('|')}|\n`;
      
      rows.forEach((row: any) => {
        output += `| ${importantColumns.map(col => this.formatFieldValue(row[col]) || '').join(' | ')} |\n`;
      });
    }
    
    return output;
  }

  private translateStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'prospect': '🔍 Prospect',
      'devis_en_cours': '📝 Devis en cours',
      'devis_accepte': '✅ Devis accepté',
      'en_cours': '🚧 En cours',
      'termine': '✅ Terminé',
      'annule': '❌ Annulé'
    };
    
    return statusMap[status] || status;
  }

  private shouldDisplayField(key: string, value: any): boolean {
    // Ignorer les champs très longs ou non informatifs
    if (!value) return false;
    if (key === 'description' && typeof value === 'string' && value.length > 100) return false;
    if (key.includes('_at') && key !== 'created_at') return false;
    if (typeof value === 'string' && value.startsWith('{\\rtf1')) return false;
    
    return true;
  }

  private formatFieldValue(value: any): string {
    if (!value) return '';
    
    // Formatage des dates
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        return new Date(value).toLocaleDateString('fr-FR');
      } catch {
        return value;
      }
    }
    
    // Truncate les textes longs
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 47) + '...';
    }
    
    return String(value);
  }

  private getImportantColumns(row: any): string[] {
    const allColumns = Object.keys(row);
    
    // Toujours commencer par l'ID s'il existe
    const idColumn = allColumns.find(col => col.toLowerCase() === 'id' || col.endsWith('_id'));
    const priorityColumns = ['reference', 'name', 'status', 'start_date', 'end_date'];
    
    // Commencer par l'ID puis les colonnes prioritaires, en filtrant les valeurs undefined
    const important = [idColumn, ...priorityColumns].filter((col): col is string => col !== undefined && allColumns.includes(col));
    
    // Ajouter d'autres colonnes importantes jusqu'à 6 max
    const remaining = allColumns
      .filter(col => !important.includes(col))
      .filter(col => this.shouldDisplayField(col, row[col]))
      .slice(0, 6 - important.length);
    
    return [...important, ...remaining];
  }

  private async listTables(database: 'sync' | 'app'): Promise<string> {
    try {
      const tables = await this.databaseService.listTables(database);
      let response = `**Tables disponibles dans la base "${database}":**\n\n`;
      
      if (Array.isArray(tables) && tables.length > 0) {
        tables.forEach((table, index) => {
          response += `${index + 1}. ${table.table_name}\n`;
        });
      } else {
        response += 'Aucune table trouvée ou erreur lors de la récupération.';
      }

      return response;
    } catch (error) {
      return `Erreur lors de la récupération des tables: ${error.message}`;
    }
  }

  private async getSchema(database: 'sync' | 'app'): Promise<string> {
    try {
      const schema = await this.databaseService.getTableSchema(database);
      return `**Schéma de la base de données "${database}":**\n\n${schema}`;
    } catch (error) {
      return `Erreur lors de la récupération du schéma: ${error.message}`;
    }
  }

  private getHelpMessage(): string {
    return `**Guide d'utilisation du Chatbot de Base de Données**

**Commandes disponibles:**
- \`liste tables\` - Afficher toutes les tables disponibles
- \`schéma\` ou \`structure\` - Voir la structure des tables
- \`aide\` - Afficher ce message d'aide

**Sélection de base de données:**
- "base sync" - Utiliser la base de synchronisation
- "base app" - Utiliser la base applicative

**Exemples de questions:**
- "Combien d'enregistrements dans la table Customer ?"
- "Montre-moi les 10 derniers éléments de la table orders"
- "Quelle est la moyenne des prix ?"
- "Liste des produits par catégorie"

**Note:** Je ne peux exécuter que des requêtes de lecture (SELECT). Je ne peux pas modifier les données.

**État des connexions:**
- Base sync: ${this.databaseService.isConnected('sync') ? '🟢 Connectée' : '🔴 Déconnectée'}
- Base app: ${this.databaseService.isConnected('app') ? '🟢 Connectée' : '🔴 Déconnectée'}`;
  }

  async getConversationHistory(conversationId: string): Promise<ConversationContext | null> {
    return this.conversations.get(conversationId) || null;
  }

  async clearConversation(conversationId: string): Promise<boolean> {
    return this.conversations.delete(conversationId);
  }

  private getPredefinedQuery(question: string, analysis: any, database: 'sync' | 'app'): string | null {
    const questionLower = question.toLowerCase();
    console.log('🔍 getPredefinedQuery - Question analysée:', questionLower);
    
    // Questions de disponibilité - semaine prochaine
    if ((questionLower.includes('disponible') || questionLower.includes('dispo') || questionLower.includes('libre') || 
         (questionLower.includes('ne') && questionLower.includes('travaille'))) && 
        questionLower.includes('semaine prochaine')) {
      
      console.log('✅ Requête prédéfinie détectée: disponibilité semaine prochaine');
      
      return `
        SELECT 
          s.firstname || ' ' || s.lastname as employe,
          s.email,
          s.is_available,
          CASE 
            WHEN s.is_available = false THEN 'Indisponible'
            WHEN COUNT(e.id) = 0 THEN 'Totalement disponible'
            ELSE CONCAT('Partiellement occupé (', COUNT(e.id), ' événements)')
          END as statut_semaine_prochaine,
          COUNT(e.id) as nb_evenements_prevus
        FROM staff s
        LEFT JOIN events e ON s.id = e.staff_id 
          AND e.start_date::date BETWEEN CURRENT_DATE + INTERVAL '7 days' AND CURRENT_DATE + INTERVAL '14 days'
        GROUP BY s.id, s.firstname, s.lastname, s.email, s.is_available
        ORDER BY s.lastname, s.firstname
      `;
    }

    // Questions de disponibilité - demain
    if ((questionLower.includes('disponible') || questionLower.includes('dispo') || questionLower.includes('libre') || 
         (questionLower.includes('ne') && questionLower.includes('travaille'))) && 
        questionLower.includes('demain')) {
      
      console.log('✅ Requête prédéfinie détectée: disponibilité demain');
      
      return `
        SELECT 
          s.firstname || ' ' || s.lastname as employe,
          s.email,
          s.is_available,
          CASE 
            WHEN s.is_available = false THEN 'Indisponible'
            WHEN COUNT(e.id) = 0 THEN 'Disponible'
            ELSE 'Occupé'
          END as statut_demain,
          COUNT(e.id) as nb_evenements_demain
        FROM staff s
        LEFT JOIN events e ON s.id = e.staff_id 
          AND e.start_date::date = CURRENT_DATE + INTERVAL '1 day'
        GROUP BY s.id, s.firstname, s.lastname, s.email, s.is_available
        ORDER BY s.lastname, s.firstname
      `;
    }

    // Questions générales de disponibilité
    if (questionLower.includes('disponible') || questionLower.includes('dispo') || questionLower.includes('libre') || 
        (questionLower.includes('ne') && questionLower.includes('travaille'))) {
      
      console.log('✅ Requête prédéfinie détectée: disponibilité générale');
      
      return `
        SELECT 
          s.firstname || ' ' || s.lastname as employe,
          s.email,
          s.is_available as est_disponible,
          CASE 
            WHEN s.is_available = true THEN 'Disponible'
            ELSE 'Indisponible'
          END as statut
        FROM staff s
        ORDER BY s.lastname, s.firstname
      `;
    }

    // Questions de planning général
    if (questionLower.includes('planning') || questionLower.includes('agenda')) {
      const timeCondition = questionLower.includes('semaine prochaine') 
        ? "BETWEEN CURRENT_DATE + INTERVAL '7 days' AND CURRENT_DATE + INTERVAL '14 days'"
        : questionLower.includes('demain')
        ? "= CURRENT_DATE + INTERVAL '1 day'"
        : "BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'";

      return `
        SELECT 
          s.firstname || ' ' || s.lastname as employe,
          e.title as evenement,
          e.start_date,
          e.end_date,
          p.name as projet,
          e.location
        FROM staff s
        LEFT JOIN events e ON s.id = e.staff_id 
          AND e.start_date::date ${timeCondition}
        LEFT JOIN projects p ON e.project_id = p.id
        ORDER BY e.start_date, s.lastname
      `;
    }

    // Questions de rentabilité et projets les plus rentables
    if (questionLower.includes('rentable') || questionLower.includes('rentabilité') || 
        (questionLower.includes('chantier') && (questionLower.includes('meilleur') || questionLower.includes('plus'))) ||
        questionLower.includes('profitable') || questionLower.includes('marge')) {
      
      console.log('✅ Requête prédéfinie détectée: rentabilité des projets');
      
      return `
        SELECT 
          p.reference,
          p.name,
          p.status,
          p.budget,
          p.actual_cost,
          p.margin,
          ROUND((p.margin / NULLIF(p.actual_cost, 0) * 100), 2) as retour_sur_investissement_pct,
          ROUND((p.margin / NULLIF(p.budget, 0) * 100), 2) as marge_budget_pct,
          COALESCE(c.company_name, c.firstname || ' ' || c.lastname) as client_name,
          CASE 
            WHEN p.status = 'termine' THEN 'Terminé'
            WHEN p.status = 'en_cours' THEN 'En cours'
            WHEN p.status = 'en_pause' THEN 'En pause'
            WHEN p.status = 'en_preparation' THEN 'En préparation'
            WHEN p.status = 'devis_accepte' THEN 'Devis accepté'
            WHEN p.status = 'devis_en_cours' THEN 'Devis en cours'
            WHEN p.status = 'prospect' THEN 'Prospect'
            WHEN p.status = 'annule' THEN 'Annulé'
            ELSE p.status
          END as statut_detail
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.margin IS NOT NULL AND p.margin > 0
        ORDER BY p.margin DESC
        LIMIT 15
      `;
    }

    console.log('❌ Aucune requête prédéfinie trouvée');
    return null; // Aucune requête prédéfinie trouvée
  }

  private async analyzeQuestionWithAI(question: string, database: 'sync' | 'app'): Promise<{
    clarifiedQuestion?: string;
    intent: string;
    tables: string[];
    timeRange?: string;
    isNegation: boolean;
    error?: string;
  }> {
    try {
      const analysisPrompt = `Tu es un expert en analyse de questions métier pour une entreprise de BTP.

ANALYSE CETTE QUESTION : "${question}"

Tu dois identifier :
1. L'INTENTION principale (planning, disponibilité, projets, équipe, etc.)
2. Si c'est une NÉGATION ("ne travaille pas", "pas disponible", etc.)
3. La PÉRIODE temporelle (demain, semaine prochaine, etc.)
4. Les TABLES probablement nécessaires
5. Une VERSION CLARIFIÉE de la question

Base de données "${database}" disponible avec tables :
- staff (employés)
- events (planning)
- projects (chantiers)
- time_logs (pointage)
- clients

EXEMPLES :
"qui ne travail pas la semaine prochaine" →
INTENTION: disponibilité
NÉGATION: true
PÉRIODE: semaine prochaine (CURRENT_DATE + 7 à +14 jours)
TABLES: staff, events
CLARIFIÉE: "Quels employés n'ont aucun événement planifié entre le [date début] et [date fin] ?"

"qui est dispo demain" →
INTENTION: disponibilité
NÉGATION: false
PÉRIODE: demain (CURRENT_DATE + 1)
TABLES: staff, events
CLARIFIÉE: "Quels employés sont disponibles le [date] ?"

Réponds UNIQUEMENT en JSON :
{
  "intent": "disponibilité|planning|projets|équipe|général",
  "isNegation": true|false,
  "timeRange": "demain|cette_semaine|semaine_prochaine|mois|autre",
  "tables": ["staff", "events"],
  "clarifiedQuestion": "Question reformulée clairement",
  "error": null
}`;

      const response = await this.openaiService.generateResponse([
        { role: 'system', content: analysisPrompt },
        { role: 'user', content: question }
      ]);
      
      // Tenter de parser la réponse JSON
      try {
        const analysis = JSON.parse(response);
        return analysis;
      } catch (parseError) {
        console.error('Erreur parsing analyse question:', parseError, 'Réponse:', response);
        return {
          intent: 'général',
          tables: ['staff'],
          isNegation: false,
          error: 'Impossible d\'analyser la question'
        };
      }

    } catch (error) {
      console.error('Erreur analyse question:', error);
      return {
        intent: 'général',
        tables: ['staff'],
        isNegation: false,
        error: error.message
      };
    }
  }
} 