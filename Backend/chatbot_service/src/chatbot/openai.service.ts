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

  async generateSqlQueryWithPrompt(contextualPrompt: string, userQuestion: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Utiliser le modèle plus rapide et efficace
        messages: [
          {
            role: 'system',
            content: contextualPrompt
          },
          {
            role: 'user',
            content: userQuestion
          }
        ],
        temperature: 0.1,
        max_tokens: 1000, // Augmenter la limite de tokens
      });

      return completion.choices[0]?.message?.content?.trim() || 'ERREUR: Pas de réponse générée';
    } catch (error) {
      console.error('Erreur OpenAI:', error);
      return 'ERREUR: Impossible de générer la requête SQL';
    }
  }

  async generateSqlQuery(userQuestion: string, tableSchema: string): Promise<string> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    const systemPrompt = `Tu es un expert en SQL qui aide à générer des requêtes PostgreSQL précises.

⏰ CONTEXTE TEMPOREL IMPORTANT :
- Nous sommes actuellement en ${currentYear}
- "cette année" = ${currentYear}
- "l'année en cours" = ${currentYear}
- "l'année dernière" = ${currentYear - 1}

Voici le schéma de la base de données:
${tableSchema}

MAPPINGS DE CONCEPTS MÉTIER:
- "utilisateurs" peut référer aux tables: clients, staff
- "chantiers" ou "projets" peut référer à: projects
- "véhicules" peut référer à: vehicles
- "matériaux" peut référer à: materials
- "tâches" peut référer à: tasks
- "événements" peut référer à: events
- "rapports" peut référer à: site_reports
- "retard" souvent lié aux dates: regarder les colonnes de dates dans projects, tasks
- "en cours" : chercher les statuts actifs dans projects ou project_stages

VALEURS ENUM IMPORTANTES:
- projects.status: 'prospect', 'devis_en_cours', 'devis_accepte', 'en_cours', 'termine', 'annule'
- Pour les chantiers en retard: status = 'en_cours' AND end_date < CURRENT_DATE
- Pour les chantiers en cours: status = 'en_cours'
- Pour les chantiers terminés: status = 'termine'

TRAITEMENT DES RÉFÉRENCES TEMPORELLES :
- "cette année" → WHERE EXTRACT(YEAR FROM date_column) = ${currentYear}
- "l'année en cours" → WHERE EXTRACT(YEAR FROM date_column) = ${currentYear}
- "devis cette année" → WHERE type = 'devis' AND EXTRACT(YEAR FROM issue_date) = ${currentYear}
- "documents cette année" → WHERE EXTRACT(YEAR FROM issue_date) = ${currentYear}

Règles importantes:
- Génère uniquement des requêtes SELECT (lecture seule)
- Utilise la syntaxe PostgreSQL correcte
- Pour COUNT, utilise COUNT(*) ou COUNT(id) si il y a une colonne id
- Limite les résultats avec LIMIT si approprié (max 50)
- Si la question mentionne "utilisateurs" sans précision, privilégie la table 'staff'
- Réponds uniquement avec la requête SQL, sans explication supplémentaire
- Si tu n'es pas sûr de quelle table utiliser, choisis la plus probable selon le contexte
- Ne réponds "ERREUR" que si vraiment aucune table ne correspond
- TOUJOURS utiliser ${currentYear} pour "cette année", pas 2023 ou une autre année
`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userQuestion },
    ];

    return await this.generateResponse(messages);
  }
} 