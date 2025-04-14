import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import {
  Document,
  CreateDocumentDto,
  UpdateDocumentDto,
} from './interfaces/document.interface';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getAllDocuments(
    limit?: number,
    offset?: number,
    searchQuery?: string,
    clientId?: number,
    projectId?: number,
  ): Promise<Document[]> {
    const documents = await this.prisma.documents.findMany({
      where: {
        ...(searchQuery
          ? {
              OR: [
                { reference: { contains: searchQuery, mode: 'insensitive' } },
                { notes: { contains: searchQuery, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(clientId ? { client_id: clientId } : {}),
        ...(projectId ? { project_id: projectId } : {}),
      },
      skip: offset ?? 0,
      take: limit ?? 100,
      orderBy: {
        created_at: 'desc',
      },
    });
    return documents as Document[];
  }

  async getDocumentById(id: number): Promise<Document | null> {
    const document = await this.prisma.documents.findUnique({
      where: { id },
    });
    return document as Document | null;
  }

  async createDocument(documentDto: CreateDocumentDto): Promise<Document> {
    const document = await this.prisma.documents.create({
      data: {
        ...documentDto,
        created_at: new Date(),
      },
    });
    return document as Document;
  }

  async updateDocument(
    id: number,
    documentDto: UpdateDocumentDto,
  ): Promise<Document | null> {
    try {
      const document = await this.prisma.documents.update({
        where: { id },
        data: {
          ...documentDto,
          created_at: new Date(),
        },
      });
      return document as Document;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async deleteDocument(id: number): Promise<boolean> {
    try {
      await this.prisma.documents.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async getDocumentsByClientId(clientId: number): Promise<Document[]> {
    const documents = await this.prisma.documents.findMany({
      where: {
        client_id: clientId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return documents as Document[];
  }

  async getDocumentsByProjectId(projectId: number): Promise<Document[]> {
    const documents = await this.prisma.documents.findMany({
      where: {
        project_id: projectId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return documents as Document[];
  }
}
