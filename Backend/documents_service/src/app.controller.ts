import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import {
  Document,
  CreateDocumentDto,
  UpdateDocumentDto,
} from './interfaces/document.interface';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern({ cmd: 'get_all_documents' })
  async getAllDocuments(data?: {
    limit?: number;
    offset?: number;
    searchQuery?: string;
    clientId?: number;
    projectId?: number;
  }): Promise<Document[]> {
    try {
      return await this.appService.getAllDocuments(
        data?.limit,
        data?.offset,
        data?.searchQuery,
        data?.clientId,
        data?.projectId,
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      return [];
    }
  }

  @MessagePattern({ cmd: 'get_document_by_id' })
  async getDocumentById(data: { id: number }): Promise<Document | null> {
    try {
      return await this.appService.getDocumentById(data.id);
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du document ${data.id}:`,
        error,
      );
      return null;
    }
  }

  @MessagePattern({ cmd: 'create_document' })
  async createDocument(data: CreateDocumentDto): Promise<Document> {
    try {
      return await this.appService.createDocument(data);
    } catch (error) {
      console.error('Erreur lors de la création du document:', error);
      throw error;
    }
  }

  @MessagePattern({ cmd: 'update_document' })
  async updateDocument(data: {
    id: number;
    documentDto: UpdateDocumentDto;
  }): Promise<Document | null> {
    try {
      return await this.appService.updateDocument(data.id, data.documentDto);
    } catch (error) {
      console.error(
        `Erreur lors de la mise à jour du document ${data.id}:`,
        error,
      );
      return null;
    }
  }

  @MessagePattern({ cmd: 'delete_document' })
  async deleteDocument(data: { id: number }): Promise<boolean> {
    try {
      return await this.appService.deleteDocument(data.id);
    } catch (error) {
      console.error(
        `Erreur lors de la suppression du document ${data.id}:`,
        error,
      );
      return false;
    }
  }

  @MessagePattern({ cmd: 'get_documents_by_client_id' })
  async getDocumentsByClientId(data: {
    clientId: number;
  }): Promise<Document[]> {
    try {
      return await this.appService.getDocumentsByClientId(data.clientId);
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des documents du client ${data.clientId}:`,
        error,
      );
      return [];
    }
  }

  @MessagePattern({ cmd: 'get_documents_by_project_id' })
  async getDocumentsByProjectId(data: {
    projectId: number;
  }): Promise<Document[]> {
    try {
      return await this.appService.getDocumentsByProjectId(data.projectId);
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des documents du projet ${data.projectId}:`,
        error,
      );
      return [];
    }
  }
}
