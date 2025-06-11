import { Injectable } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { DatabaseService } from './database.service';
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
  ) {}

  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const conversationId = request.conversationId || uuidv4();
    let conversation = this.conversations.get(conversationId);

    if (!conversation) {
      conversation = {
        id: conversationId,
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant intelligent qui aide les utilisateurs à interroger des bases de données PostgreSQL.

Tu as accès à deux bases de données:
- "sync": Base de données de synchronisation (postgres_sync)
- "app": Base de données applicative (postgres_app)

Tu peux:
1. Répondre aux questions générales sur les données
2. Générer et exécuter des requêtes SQL pour répondre aux questions spécifiques
3. Analyser les données et fournir des statistiques
4. Expliquer la structure des tables

Instructions importantes:
- Demande quelle base de données utiliser si ce n'est pas précisé
- Génère uniquement des requêtes SELECT (lecture seule)
- Explique tes réponses de manière claire et structurée
- Si une requête échoue, propose une alternative ou demande des clarifications
- Fournis du contexte sur les données quand c'est pertinent

Réponds toujours en français et sois professionnel mais accessible.`,
          },
        ],
        database: request.database || 'app', // Par défaut
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
      content: request.message,
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
      'en cours', 'terminé', 'fini', 'avancement', 'état', 'statut'
    ];

    return queryKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private async handleDatabaseQuery(conversation: ConversationContext, userMessage: string): Promise<string> {
    try {
      // Obtenir le schéma de la base de données
      const schema = await this.databaseService.getTableSchema(conversation.database);

      // Générer la requête SQL avec OpenAI
      const sqlQuery = await this.openaiService.generateSqlQuery(userMessage, schema);

      if (sqlQuery.startsWith('ERREUR:')) {
        return `Je n'ai pas pu comprendre votre question ou elle ne correspond pas aux données disponibles. ${sqlQuery}`;
      }

      // Nettoyer la requête SQL
      const cleanQuery = this.cleanSqlQuery(sqlQuery);

      if (!cleanQuery) {
        return 'Je n\'ai pas pu générer une requête SQL valide pour votre question. Pouvez-vous reformuler ?';
      }

      // Exécuter la requête
      const result = await this.databaseService.executeQuery(cleanQuery, conversation.database, 50);

      // Formatter la réponse
      return this.formatQueryResult(result, userMessage, cleanQuery);

    } catch (error) {
      console.error('Erreur lors de la requête:', error);
      return `Désolé, une erreur s'est produite lors de l'exécution de la requête: ${error.message}`;
    }
  }

  private cleanSqlQuery(query: string): string {
    // Supprimer les backticks et autres formatages
    let cleanQuery = query.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Vérifier que c'est bien une requête SELECT
    if (!cleanQuery.toLowerCase().startsWith('select')) {
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
      // Résultats multiples
      response += `**${result.rows.length} résultat(s) trouvé(s):**\n\n`;
      
      // Limiter l'affichage à 10 résultats pour la lisibilité
      const rowsToShow = result.rows.slice(0, 10);
      
      if (result.rows.length <= 3) {
        // Affichage détaillé pour peu de résultats
        rowsToShow.forEach((row: any, index: number) => {
          response += `**${index + 1}.** `;
          Object.entries(row).forEach(([key, value]) => {
            response += `${key}: ${value} | `;
          });
          response = response.slice(0, -3) + '\n';
        });
      } else {
        // Affichage tabulaire pour plus de résultats
        const columns = Object.keys(result.rows[0]);
        response += `| ${columns.join(' | ')} |\n`;
        response += `|${columns.map(() => '---').join('|')}|\n`;
        
        rowsToShow.forEach((row: any) => {
          response += `| ${columns.map(col => row[col] || '').join(' | ')} |\n`;
        });
      }

      if (result.rows.length > 10) {
        response += `\n... et ${result.rows.length - 10} autres résultats.\n`;
      }
    }

    response += `\n*Requête SQL exécutée:* \`${sqlQuery}\``;
    response += `\n*Base de données:* ${result.database}`;

    return response;
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
} 