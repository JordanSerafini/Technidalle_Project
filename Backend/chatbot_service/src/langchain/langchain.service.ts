// src/langchain/langchain.service.ts
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { z } from 'zod';

// Interface pour les résultats d'analyse
export interface QuestionAnalysisResult {
  intent: string;
  entities: Array<{
    name: string;
    value: string;
    type: string;
  }>;
  reformulatedQuestion: string;
  category: string;
  possibleQueries: string[];
}

// Interface pour les messages de conversation
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class LangchainService {
  private readonly logger = new Logger(LangchainService.name);
  private readonly chatModel: ChatOpenAI;
  private readonly gpt4Model: ChatOpenAI;

  constructor(private readonly configService: ConfigService) {
    this.chatModel = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
    
    // Initialiser un modèle GPT-4 pour les tâches plus complexes
    this.gpt4Model = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.2,
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async analyzeQuestion(question: string): Promise<QuestionAnalysisResult> {
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        intent: z.string().describe("L'intention principale de l'utilisateur"),
        entities: z
          .array(
            z.object({
              name: z.string(),
              value: z.string(),
              type: z.string(),
            }),
          )
          .describe('Entités identifiées dans la question'),
        reformulatedQuestion: z
          .string()
          .describe('Question reformulée pour plus de clarté'),
        category: z
          .string()
          .describe('Catégorie de la question (client, véhicule, etc.)'),
        possibleQueries: z
          .array(z.string())
          .describe(
            'IDs des requêtes prédéfinies qui pourraient répondre à cette question',
          ),
      }),
    );

    const prompt = PromptTemplate.fromTemplate(`
      Analyse la question suivante et extrait les informations clés.
      
      Question: {question}
      
      {format_instructions}
    `);

    const chain = RunnableSequence.from([
      {
        question: (input) => input.question,
        format_instructions: async () => parser.getFormatInstructions(),
      },
      prompt,
      this.gpt4Model,
      parser,
    ]);

    try {
      return await chain.invoke({
        question,
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'analyse avec LangChain: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async generateResponse(
    questionContext: any,
    queryResult: any,
  ): Promise<string> {
    // Vérifier si nous avons un historique de conversation
    const conversationHistory = questionContext.conversationHistory || [];
    
    let promptTemplate;
    
    if (conversationHistory.length > 0) {
      // Prompt avec historique de conversation
      promptTemplate = PromptTemplate.fromTemplate(`
        Tu es un assistant pour une entreprise de bâtiment, tu dois répondre à des questions sur l'entreprise. 
        
        Historique de la conversation:
        {conversationHistoryText}
        
        Contexte de la question actuelle:
        Question originale: {originalQuestion}
        Question reformulée: {reformulatedQuestion}
        Intention détectée: {intent}
        
        Données obtenues de la base de données:
        {queryData}
        
        Génère une réponse naturelle, utile et concise basée sur ces données et l'historique de la conversation.
        Assure-toi de faire référence aux éléments pertinents des échanges précédents pour montrer que tu te souviens du contexte.
      `);
      
      // Formater l'historique de conversation
      const historyText = conversationHistory
        .map((msg: ConversationMessage) => `${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${msg.content}`)
        .join('\n');
      
      const chain = promptTemplate.pipe(this.gpt4Model);
      
      try {
        const result = await chain.invoke({
          conversationHistoryText: historyText,
          originalQuestion: questionContext.originalQuestion,
          reformulatedQuestion: questionContext.reformulatedQuestion || '',
          intent: questionContext.intent || 'Non spécifiée',
          queryData: JSON.stringify(queryResult),
        });
        
        return typeof result.content === 'string'
          ? result.content
          : JSON.stringify(result.content);
      } catch (error) {
        this.logger.error(
          `Erreur lors de la génération de réponse avec historique: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw error;
      }
    } else {
      // Prompt standard sans historique
      promptTemplate = PromptTemplate.fromTemplate(`
        Tu es un assistant pour une entreprise de bâtiment, tu dois répondre à des questions sur l'entreprise.
        
        Contexte de la question:
        Question originale: {originalQuestion}
        
        Données obtenues de la base de données:
        {queryData}
        
        Génère une réponse naturelle, utile et concise basée sur ces données.
      `);
      
      const chain = promptTemplate.pipe(this.chatModel);
      
      try {
        const result = await chain.invoke({
          originalQuestion: questionContext.originalQuestion,
          queryData: JSON.stringify(queryResult),
        });
        
        return typeof result.content === 'string'
          ? result.content
          : JSON.stringify(result.content);
      } catch (error) {
        this.logger.error(
          `Erreur lors de la génération de réponse: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw error;
      }
    }
  }
  
  // Méthode pour extraire des paramètres à partir d'une question utilisateur
  async extractParameters(
    question: string,
    parameterDefinitions: any[],
    previousContext: any = null,
  ): Promise<Record<string, any>> {
    if (!parameterDefinitions || parameterDefinitions.length === 0) {
      return {};
    }
    
    // Construire le schéma Zod pour les paramètres
    const paramSchema: Record<string, any> = {};
    const paramDescriptions: string[] = [];
    
    for (const param of parameterDefinitions) {
      paramSchema[param.name] = z.any().describe(param.description);
      paramDescriptions.push(`- ${param.name}: ${param.description}`);
    }
    
    const parser = StructuredOutputParser.fromZodSchema(z.object(paramSchema));
    
    // Construire le template de prompt
    let contextInfo = '';
    if (previousContext) {
      contextInfo = `
        Contexte précédent:
        ${JSON.stringify(previousContext)}
      `;
    }
    
    const promptTemplate = PromptTemplate.fromTemplate(`
      Ton objectif est d'extraire des paramètres spécifiques à partir de la question de l'utilisateur.
      
      Question: {question}
      
      Paramètres à extraire:
      {paramDescriptions}
      
      ${contextInfo}
      
      {format_instructions}
      
      Extrait seulement les paramètres qui sont clairement mentionnés dans la question.
      Pour les paramètres qui ne sont pas mentionnés, laisse-les vides ou null.
      Si un paramètre est mentionné dans le contexte précédent mais pas dans la question actuelle, utilise la valeur du contexte.
    `);
    
    const chain = RunnableSequence.from([
      {
        question: (input: any) => input.question,
        paramDescriptions: (_: any) => paramDescriptions.join('\n'),
        format_instructions: async () => parser.getFormatInstructions(),
      },
      promptTemplate,
      this.gpt4Model,
      parser,
    ]);
    
    try {
      const result = await chain.invoke({ question });
      return result;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'extraction des paramètres: ${error instanceof Error ? error.message : String(error)}`,
      );
      // En cas d'erreur, retourner un objet vide
      return {};
    }
  }
  
  /**
   * Génère une réponse pour une question générale qui ne nécessite pas d'accès à la base de données
   * @param question La question posée par l'utilisateur
   * @param analysisResult Le résultat de l'analyse de la question
   * @returns Une réponse textuelle générée
   */
  async generateGeneralResponse(
    question: string,
    analysisResult: any,
  ): Promise<string> {
    // Créer un prompt spécifique pour les questions générales
    const promptTemplate = PromptTemplate.fromTemplate(`
      Tu es un assistant intelligent pour une entreprise de bâtiment nommée TechniDalle.
      
      Tu dois répondre à une question générale qui ne nécessite pas d'accéder à la base de données.
      
      Question originale: {question}
      Intention détectée: {intent}
      
      Instructions spécifiques:
      - Donne une réponse concise et informative
      - Concentre-toi sur les informations générales relatives au secteur du bâtiment
      - Si la question concerne des spécificités de l'entreprise que tu ne connais pas, propose de rediriger vers une personne compétente
      - N'invente pas de données spécifiques sur l'entreprise ou ses clients
      - Utilise un ton professionnel mais accessible
      
      Réponds directement à la question sans répéter la question ou ajouter d'introduction inutile.
    `);
    
    // Utiliser GPT-4 pour les réponses générales pour une meilleure qualité
    const chain = promptTemplate.pipe(this.gpt4Model);
    
    try {
      const result = await chain.invoke({
        question: question,
        intent: analysisResult?.analysis?.intent || 'Non spécifiée',
      });
      
      return typeof result.content === 'string'
        ? result.content
        : JSON.stringify(result.content);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la génération de réponse générale: ${error instanceof Error ? error.message : String(error)}`,
      );
      return "Je n'ai pas pu générer une réponse à votre question. Pourriez-vous reformuler ou préciser votre demande ?";
    }
  }
}
