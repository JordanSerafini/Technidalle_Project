import { Injectable } from '@nestjs/common';

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  staffId?: number;
  preferences: {
    defaultDatabase: 'app' | 'sync';
    timezone: string;
    language: string;
  };
}

export interface ConversationMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  lastActivity: Date;
  popularQueryTypes: Record<string, number>;
}

export interface ConversationSession {
  id: string;
  userId: string;
  userProfile?: UserProfile;
  startTime: Date;
  lastActivity: Date;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    queryType?: string;
    database?: 'app' | 'sync';
    sqlQuery?: string;
    responseTime?: number;
    success?: boolean;
  }>;
  context: {
    currentProject?: string;
    currentDate?: string;
    mentionedEntities: Record<string, any>;
    activeDatabase: 'app' | 'sync';
  };
  metrics: ConversationMetrics;
}

@Injectable()
export class ConversationContextService {
  private sessions = new Map<string, ConversationSession>();
  private userProfiles = new Map<string, UserProfile>();

  createSession(userId: string, conversationId: string): ConversationSession {
    const session: ConversationSession = {
      id: conversationId,
      userId,
      userProfile: this.userProfiles.get(userId),
      startTime: new Date(),
      lastActivity: new Date(),
      messages: [],
      context: {
        mentionedEntities: {},
        activeDatabase: 'app'
      },
      metrics: {
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        averageResponseTime: 0,
        lastActivity: new Date(),
        popularQueryTypes: {}
      }
    };

    this.sessions.set(conversationId, session);
    return session;
  }

  getSession(conversationId: string): ConversationSession | undefined {
    return this.sessions.get(conversationId);
  }

  updateUserProfile(userId: string, profile: Partial<UserProfile>): void {
    const existingProfile = this.userProfiles.get(userId);
    const updatedProfile: UserProfile = {
      id: userId,
      name: profile.name || existingProfile?.name || '',
      role: profile.role || existingProfile?.role || '',
      staffId: profile.staffId || existingProfile?.staffId,
      preferences: {
        defaultDatabase: profile.preferences?.defaultDatabase || existingProfile?.preferences?.defaultDatabase || 'app',
        timezone: profile.preferences?.timezone || existingProfile?.preferences?.timezone || 'Europe/Paris',
        language: profile.preferences?.language || existingProfile?.preferences?.language || 'fr'
      }
    };
    
    this.userProfiles.set(userId, updatedProfile);
  }

  addMessage(
    conversationId: string, 
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: {
      queryType?: string;
      database?: 'app' | 'sync';
      sqlQuery?: string;
      responseTime?: number;
      success?: boolean;
    }
  ): void {
    const session = this.sessions.get(conversationId);
    if (!session) return;

    const message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      ...metadata
    };

    session.messages.push(message);
    session.lastActivity = new Date();

    // Mettre à jour les métriques
    if (role === 'user') {
      session.metrics.totalQueries++;
      session.metrics.lastActivity = new Date();
    }

    if (metadata?.success !== undefined) {
      if (metadata.success) {
        session.metrics.successfulQueries++;
      } else {
        session.metrics.failedQueries++;
      }
    }

    if (metadata?.queryType) {
      session.metrics.popularQueryTypes[metadata.queryType] = 
        (session.metrics.popularQueryTypes[metadata.queryType] || 0) + 1;
    }

    if (metadata?.responseTime) {
      const totalTime = session.metrics.averageResponseTime * (session.metrics.totalQueries - 1) + metadata.responseTime;
      session.metrics.averageResponseTime = totalTime / session.metrics.totalQueries;
    }

    // Extraire les entités mentionnées
    this.extractEntities(conversationId, content);
  }

  private extractEntities(conversationId: string, content: string): void {
    const session = this.sessions.get(conversationId);
    if (!session) return;

    const contentLower = content.toLowerCase();

    // Détection de projets/chantiers
    const projectMatches = content.match(/(?:projet|chantier)\s+([A-Z0-9-]+)/gi);
    if (projectMatches) {
      projectMatches.forEach(match => {
        const projectRef = match.split(' ')[1];
        session.context.mentionedEntities.projects = 
          session.context.mentionedEntities.projects || [];
        if (!session.context.mentionedEntities.projects.includes(projectRef)) {
          session.context.mentionedEntities.projects.push(projectRef);
        }
      });
    }

    // Détection de noms de personnes
    const nameMatches = content.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g);
    if (nameMatches) {
      session.context.mentionedEntities.people = 
        session.context.mentionedEntities.people || [];
      nameMatches.forEach(name => {
        if (!session.context.mentionedEntities.people.includes(name)) {
          session.context.mentionedEntities.people.push(name);
        }
      });
    }

    // Détection de dates
    const datePatterns = [
      /demain/gi,
      /aujourd'hui/gi,
      /cette semaine/gi,
      /ce mois/gi,
      /\d{1,2}\/\d{1,2}\/\d{4}/g,
      /\d{1,2}-\d{1,2}-\d{4}/g
    ];

    datePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        session.context.mentionedEntities.dates = 
          session.context.mentionedEntities.dates || [];
        matches.forEach(date => {
          if (!session.context.mentionedEntities.dates.includes(date)) {
            session.context.mentionedEntities.dates.push(date);
          }
        });
      }
    });
  }

  getContextualInfo(conversationId: string): string {
    const session = this.sessions.get(conversationId);
    if (!session) return '';

    let contextInfo = '';

    if (session.userProfile) {
      contextInfo += `👤 Utilisateur : ${session.userProfile.name} (${session.userProfile.role})\n`;
      if (session.userProfile.staffId) {
        contextInfo += `🆔 ID Staff : ${session.userProfile.staffId}\n`;
      }
    }

    if (Object.keys(session.context.mentionedEntities).length > 0) {
      contextInfo += '\n📋 Entités mentionnées dans la conversation :\n';
      
      if (session.context.mentionedEntities.projects) {
        contextInfo += `🏗️ Projets : ${session.context.mentionedEntities.projects.join(', ')}\n`;
      }
      
      if (session.context.mentionedEntities.people) {
        contextInfo += `👥 Personnes : ${session.context.mentionedEntities.people.join(', ')}\n`;
      }
      
      if (session.context.mentionedEntities.dates) {
        contextInfo += `📅 Dates : ${session.context.mentionedEntities.dates.join(', ')}\n`;
      }
    }

    if (session.metrics.totalQueries > 0) {
      contextInfo += `\n📊 Métriques de conversation :\n`;
      contextInfo += `• Requêtes totales : ${session.metrics.totalQueries}\n`;
      contextInfo += `• Taux de succès : ${Math.round((session.metrics.successfulQueries / session.metrics.totalQueries) * 100)}%\n`;
      
      const topQueryType = Object.entries(session.metrics.popularQueryTypes)
        .sort(([,a], [,b]) => b - a)[0];
      if (topQueryType) {
        contextInfo += `• Type de question principal : ${topQueryType[0]}\n`;
      }
    }

    return contextInfo;
  }

  getRecommendedDatabase(conversationId: string): 'app' | 'sync' {
    const session = this.sessions.get(conversationId);
    if (!session) return 'app';

    // Utiliser les préférences utilisateur
    if (session.userProfile?.preferences.defaultDatabase) {
      return session.userProfile.preferences.defaultDatabase;
    }

    // Analyser les requêtes récentes pour déterminer la base la plus utilisée
    const recentMessages = session.messages.slice(-5);
    const databaseUsage = { app: 0, sync: 0 };
    
    recentMessages.forEach(msg => {
      if (msg.database) {
        databaseUsage[msg.database]++;
      }
    });

    return databaseUsage.sync > databaseUsage.app ? 'sync' : 'app';
  }

  getSuggestions(conversationId: string): string[] {
    const session = this.sessions.get(conversationId);
    if (!session) return [];

    const suggestions: string[] = [];

    // Suggestions basées sur le rôle
    if (session.userProfile?.role === 'manager' || session.userProfile?.role === 'patron') {
      suggestions.push(
        'Analyse ma rentabilité sur les 2 derniers mois',
        'Quels sont les projets en retard ?',
        'Temps de travail par employé cette semaine'
      );
    }

    if (session.userProfile?.role === 'chef_chantier') {
      suggestions.push(
        'Quel est mon planning de demain ?',
        'Quels matériaux sont disponibles ?',
        'Statut de mes chantiers en cours'
      );
    }

    // Suggestions basées sur l'historique
    const queryTypes = Object.keys(session.metrics.popularQueryTypes);
    if (queryTypes.includes('planning')) {
      suggestions.push('Planning de la semaine prochaine');
    }

    if (queryTypes.includes('projects')) {
      suggestions.push('Avancement des projets du mois');
    }

    return suggestions.slice(0, 5); // Limiter à 5 suggestions
  }

  exportConversationData(conversationId: string): any {
    const session = this.sessions.get(conversationId);
    if (!session) return null;

    return {
      session: {
        id: session.id,
        userId: session.userId,
        duration: Date.now() - session.startTime.getTime(),
        messageCount: session.messages.length
      },
      metrics: session.metrics,
      context: session.context,
      userProfile: session.userProfile
    };
  }

  cleanupOldSessions(maxAgeHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastActivity < cutoffTime) {
        this.sessions.delete(sessionId);
      }
    }
  }
} 