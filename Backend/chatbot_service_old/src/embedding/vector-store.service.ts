import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        input: text,
        model: 'text-embedding-3-large',
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la génération d'embedding: ${error.message}`,
      );
      throw error;
    }
  }

  async storeEmbedding(
    sourceType: string,
    sourceId: number,
    content: string,
    embedding: number[],
    metadata: any = {},
  ): Promise<void> {
    try {
      // Convertir le tableau d'embedding en Buffer pour stockage en BYTEA
      const embeddingBuffer = Buffer.from(Float32Array.from(embedding).buffer);

      await this.prismaService.vector_embeddings.create({
        data: {
          source_type: sourceType,
          source_id: sourceId,
          content: content,
          embedding: embeddingBuffer,
          metadata: metadata,
        },
      });

      this.logger.log(
        `Embedding stocké avec succès pour ${sourceType} #${sourceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors du stockage d'embedding: ${error.message}`,
      );
      throw error;
    }
  }

  async findSimilar(query: string, limit: number = 5): Promise<any[]> {
    try {
      // 1. Générer l'embedding pour la requête
      const queryEmbedding = await this.generateEmbedding(query);

      // 2. Récupérer tous les embeddings de la base de données
      // Note: Ceci est une approche simplifiée. Dans un environnement de production,
      // utilisez une base de données vectorielle dédiée (Pinecone, Qdrant, etc.)
      const allEmbeddings =
        await this.prismaService.vector_embeddings.findMany();

      // 3. Calculer la similarité cosinus pour chaque embedding
      const results = allEmbeddings.map((record) => {
        // Convertir le Buffer en Float32Array puis en array JavaScript
        const storedEmbedding = new Float32Array(record.embedding);
        const embeddingArray = Array.from(storedEmbedding);

        // Calcul de similarité cosinus
        const similarity = this.cosineSimilarity(
          queryEmbedding,
          embeddingArray,
        );

        return {
          id: record.id,
          sourceType: record.source_type,
          sourceId: record.source_id,
          content: record.content,
          metadata: record.metadata,
          similarity,
        };
      });

      // 4. Trier par similarité et limiter le nombre de résultats
      const sortedResults = results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return sortedResults;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la recherche similaire: ${error.message}`,
      );
      throw error;
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

    return dotProduct / (magnitudeA * magnitudeB);
  }
}
