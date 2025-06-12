import { Controller, UseInterceptors, UploadedFile, StreamableFile, Res } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // CRUD Documents
  @MessagePattern('documents.create')
  async create(@Payload() payload: { createDocumentDto: CreateDocumentDto; file?: any }) {
    const { createDocumentDto, file } = payload;
    return this.documentsService.create(createDocumentDto, file);
  }

  @MessagePattern('documents.findAll')
  async findAll(@Payload() query: any) {
    return this.documentsService.findAll(query);
  }

  @MessagePattern('documents.findOne')
  async findOne(@Payload() id: string) {
    return this.documentsService.findOne(id);
  }

  @MessagePattern('documents.update')
  async update(@Payload() payload: { id: string } & UpdateDocumentDto) {
    const { id, ...updateData } = payload;
    return this.documentsService.update(id, updateData);
  }

  @MessagePattern('documents.delete')
  async remove(@Payload() id: string) {
    return this.documentsService.remove(id);
  }

  // Gestion des versions
  @MessagePattern('documents.createVersion')
  async createVersion(@Payload() payload: { documentId: string; file: any; changeLog?: string }) {
    const { documentId, file, changeLog } = payload;
    return this.documentsService.createVersion(documentId, file, changeLog);
  }

  @MessagePattern('documents.getVersions')
  async getVersions(@Payload() documentId: string) {
    return this.documentsService.getVersions(documentId);
  }

  // Téléchargement de fichiers
  @MessagePattern('documents.download')
  async downloadFile(@Payload() payload: { documentId: string; versionId?: string }) {
    const { documentId, versionId } = payload;
    const fileBuffer = await this.documentsService.getFileBuffer(documentId, versionId);
    return {
      buffer: fileBuffer.toString('base64'),
      contentType: 'application/octet-stream'
    };
  }

  // Recherche
  @MessagePattern('documents.search')
  async search(@Payload() searchTerm: string) {
    return this.documentsService.search(searchTerm);
  }

  // Gestion des catégories
  @MessagePattern('documents.categories.create')
  async createCategory(@Payload() createCategoryDto: CreateCategoryDto) {
    return this.documentsService.createCategory(createCategoryDto);
  }

  @MessagePattern('documents.categories.findAll')
  async findAllCategories() {
    return this.documentsService.findAllCategories();
  }

  @MessagePattern('documents.categories.findOne')
  async findCategory(@Payload() id: string) {
    return this.documentsService.findCategory(id);
  }

  @MessagePattern('documents.categories.update')
  async updateCategory(@Payload() payload: { id: string } & Partial<CreateCategoryDto>) {
    const { id, ...updateData } = payload;
    return this.documentsService.updateCategory(id, updateData);
  }

  @MessagePattern('documents.categories.delete')
  async removeCategory(@Payload() id: string) {
    return this.documentsService.removeCategory(id);
  }

  // Statistiques
  @MessagePattern('documents.statistics')
  async getStatistics() {
    return this.documentsService.getStatistics();
  }

  // Méthodes spécifiques pour mobile
  @MessagePattern('documents.recent')
  async getRecentDocuments(@Payload() limit?: number) {
    return this.documentsService.getRecentDocuments(limit);
  }

  @MessagePattern('documents.byProject')
  async getDocumentsByProject(@Payload() projectId: string) {
    return this.documentsService.getDocumentsByProject(projectId);
  }

  @MessagePattern('documents.byClient')
  async getDocumentsByClient(@Payload() clientId: string) {
    return this.documentsService.getDocumentsByClient(clientId);
  }

  @MessagePattern('documents.expired')
  async getExpiredDocuments() {
    return this.documentsService.getExpiredDocuments();
  }

  // Filtres avancés
  @MessagePattern('documents.byType')
  async getDocumentsByType(@Payload() payload: { type: string; limit?: number }) {
    const { type, limit = 50 } = payload;
    return this.documentsService.findAll({ type, limit });
  }

  @MessagePattern('documents.byStatus')
  async getDocumentsByStatus(@Payload() payload: { status: string; limit?: number }) {
    const { status, limit = 50 } = payload;
    return this.documentsService.findAll({ status, limit });
  }

  @MessagePattern('documents.confidential')
  async getConfidentialDocuments(@Payload() limit?: number) {
    return this.documentsService.findAll({ isConfidential: true, limit: limit || 50 });
  }

  // Gestion des tags
  @MessagePattern('documents.byTags')
  async getDocumentsByTags(@Payload() payload: { tags: string; limit?: number }) {
    const { tags, limit = 50 } = payload;
    return this.documentsService.findAll({ tags, limit });
  }
} 