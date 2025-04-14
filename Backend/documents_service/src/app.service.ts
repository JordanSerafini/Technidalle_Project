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
      where: { id },
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
        where: { id },
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
        where: { id },
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
