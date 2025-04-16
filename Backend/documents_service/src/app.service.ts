import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import {
  Document,
  CreateDocumentDto,
  UpdateDocumentDto,
  ProjectMedia,
  CreateProjectMediaDto,
  UpdateProjectMediaDto,
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
    const where = {
      ...(clientId ? { client_id: clientId } : {}),
      ...(projectId ? { project_id: projectId } : {}),
    };

    // Si searchQuery est défini, ajouter les conditions de recherche
    if (searchQuery && searchQuery.length > 1) {
      where['OR'] = [
        { reference: { contains: searchQuery, mode: 'insensitive' } },
        { notes: { contains: searchQuery, mode: 'insensitive' } },
        { payment_method: { contains: searchQuery, mode: 'insensitive' } },
        { status: { contains: searchQuery, mode: 'insensitive' } },
        { type: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const documents = await this.prisma.documents.findMany({
      where,
      skip: offset ?? 0,
      take: limit ?? 100,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        clients: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            company_name: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Recherche supplémentaire sur les données liées aux clients
    if (searchQuery && searchQuery.length > 1) {
      const filteredDocuments = documents.filter((doc) => {
        // Vérification par défaut avec les conditions OR déjà appliquées
        const defaultCheck =
          (doc.reference &&
            doc.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (doc.notes &&
            doc.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (doc.payment_method &&
            doc.payment_method
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (doc.status &&
            doc.status.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (doc.type &&
            doc.type.toLowerCase().includes(searchQuery.toLowerCase()));

        if (defaultCheck) return true;

        // Recherche dans les informations du client
        if (doc.clients) {
          const client = doc.clients;
          const searchInClient =
            (client.firstname &&
              client.firstname
                .toLowerCase()
                .includes(searchQuery.toLowerCase())) ||
            (client.lastname &&
              client.lastname
                .toLowerCase()
                .includes(searchQuery.toLowerCase())) ||
            (client.company_name &&
              client.company_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase()));

          if (searchInClient) return true;
        }

        // Recherche dans les informations du projet
        if (doc.projects) {
          const project = doc.projects;
          if (
            project.name &&
            project.name.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            return true;
          }
        }

        // Recherche dans les montants (conversion du montant en chaîne)
        if (doc.amount !== null) {
          const amountStr = doc.amount.toString();
          if (amountStr.includes(searchQuery)) {
            return true;
          }
        }

        return false;
      });

      return filteredDocuments as Document[];
    }

    return documents as Document[];
  }

  async getDocumentById(id: number): Promise<Document | null> {
    const document = await this.prisma.documents.findUnique({
      where: { id: Number(id) },
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
        where: { id: Number(id) },
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
        where: { id: Number(id) },
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
        client_id: Number(clientId),
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
        project_id: Number(projectId),
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return documents as Document[];
  }

  async getAllProjectMedia(
    limit?: number,
    offset?: number,
    projectId?: number,
  ): Promise<ProjectMedia[]> {
    const media = await this.prisma.project_media.findMany({
      where: {
        ...(projectId ? { project_id: projectId } : {}),
      },
      skip: offset ?? 0,
      take: limit ?? 100,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        projects: true,
        staff: true,
        project_stages: true,
      },
    });
    return media as ProjectMedia[];
  }

  async getProjectMediaById(id: number): Promise<ProjectMedia | null> {
    const media = await this.prisma.project_media.findUnique({
      where: { id: Number(id) },
      include: {
        projects: true,
        staff: true,
        project_stages: true,
      },
    });
    return media as ProjectMedia | null;
  }

  async getMediaByProjectId(projectId: number): Promise<ProjectMedia[]> {
    const media = await this.prisma.project_media.findMany({
      where: {
        project_id: Number(projectId),
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        staff: true,
        project_stages: true,
      },
    });
    return media as ProjectMedia[];
  }

  async createProjectMedia(
    mediaDto: CreateProjectMediaDto,
  ): Promise<ProjectMedia> {
    const media = await this.prisma.project_media.create({
      data: {
        project_id: mediaDto.project_id,
        stage_id: mediaDto.stage_id,
        staff_id: mediaDto.staff_id,
        media_type: mediaDto.media_type,
        file_path: mediaDto.file_path,
        description: mediaDto.description,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        projects: true,
        staff: true,
        project_stages: true,
      },
    });
    return media as ProjectMedia;
  }

  async updateProjectMedia(
    id: number,
    mediaDto: UpdateProjectMediaDto,
  ): Promise<ProjectMedia | null> {
    try {
      const media = await this.prisma.project_media.update({
        where: { id: Number(id) },
        data: {
          project_id: mediaDto.project_id,
          stage_id: mediaDto.stage_id,
          staff_id: mediaDto.staff_id,
          media_type: mediaDto.media_type,
          file_path: mediaDto.file_path,
          description: mediaDto.description,
          updated_at: new Date(),
        },
        include: {
          projects: true,
          staff: true,
          project_stages: true,
        },
      });
      return media as ProjectMedia;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async deleteProjectMedia(id: number): Promise<boolean> {
    try {
      await this.prisma.project_media.delete({
        where: { id: Number(id) },
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
