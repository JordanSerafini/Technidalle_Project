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

Règles importantes:
- Génère uniquement des requêtes SELECT (lecture seule)
- Utilise la syntaxe PostgreSQL
- Limite les résultats avec LIMIT si approprié
- Réponds uniquement avec la requête SQL, sans explication supplémentaire
- Si la question n'est pas claire ou ne correspond pas aux tables disponibles, réponds "ERREUR: Question non comprise ou hors périmètre"`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userQuestion },
    ];

    return await this.generateResponse(messages);
  }
} 