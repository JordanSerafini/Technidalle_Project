import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    tools?: Array<any>
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: tools ? 'auto' : undefined,
        temperature: 0.2,
        max_tokens: 5000,
      });

      const message = response.choices[0]?.message;
      
      if (message?.tool_calls) {
        return JSON.stringify({
          content: message.content,
          tool_calls: message.tool_calls,
        });
      }

      return message?.content || 'Désolé, je n\'ai pas pu générer une réponse.';
    } catch (error) {
      console.error('Erreur OpenAI:', error);
      throw new Error('Erreur lors de la génération de la réponse');
    }
  }

  async generateSqlQuery(userQuestion: string, tableSchema: string): Promise<string> {
    const systemPrompt = `Tu es un expert en SQL qui aide à générer des requêtes PostgreSQL précises.
    
Voici le schéma de la base de données:
${tableSchema}

MAPPINGS DE CONCEPTS MÉTIER:
- "utilisateurs" peut référer aux tables: clients, staff
- "projets" peut référer à: projects
- "véhicules" peut référer à: vehicles
- "matériaux" peut référer à: materials
- "tâches" peut référer à: tasks
- "événements" peut référer à: events
- "rapports" peut référer à: site_reports

Règles importantes:
- Génère uniquement des requêtes SELECT (lecture seule)
- Utilise la syntaxe PostgreSQL correcte
- Pour COUNT, utilise COUNT(*) ou COUNT(id) si il y a une colonne id
- Limite les résultats avec LIMIT si approprié (max 50)
- Si la question mentionne "utilisateurs" sans précision, privilégie la table 'clients'
- Réponds uniquement avec la requête SQL, sans explication supplémentaire
- Si tu n'es pas sûr de quelle table utiliser, choisis la plus probable selon le contexte
- Ne réponds "ERREUR" que si vraiment aucune table ne correspond`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userQuestion },
    ];

    return await this.generateResponse(messages);
  }
} 