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

@Injectable()
export class LangchainService {
  private readonly logger = new Logger(LangchainService.name);
  private readonly chatModel: ChatOpenAI;

  constructor(private readonly configService: ConfigService) {
    this.chatModel = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
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
      this.chatModel,
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
    const prompt = PromptTemplate.fromTemplate(`
      Tu es un assistant pour une entreprise de batiment, tu dois répondre à des questions sur l'entreprise l'entreprise. 
      
      Contexte de la question:
      Question originale: {originalQuestion}
      
      Données obtenues de la base de données:
      {queryData}
      
      Génère une réponse naturelle et utile basée sur ces données.
    `);

    const chain = prompt.pipe(this.chatModel);

    try {
      const result = await chain.invoke({
        originalQuestion: questionContext.originalQuestion,
        queryData: JSON.stringify(queryResult),
      });

      // Assurer que la valeur retournée est une chaîne
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
