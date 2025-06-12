import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Document, DocumentType, DocumentStatus } from '../entities/document.entity';
import { DocumentCategory } from '../entities/document-category.entity';
import { DocumentVersion } from '../entities/document-version.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(DocumentCategory)
    private categoriesRepository: Repository<DocumentCategory>,
    @InjectRepository(DocumentVersion)
    private versionsRepository: Repository<DocumentVersion>,
  ) {}

  // CRUD Documents
  async create(createDocumentDto: CreateDocumentDto, file?: Express.Multer.File): Promise<Document> {
    if (!file) {
      throw new BadRequestException('Fichier requis');
    }

    const document = this.documentsRepository.create({
      ...createDocumentDto,
      filePath: file.path,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    const savedDocument = await this.documentsRepository.save(document);

    // Créer la première version
    await this.createVersion(savedDocument.id, file, 'Version initiale');

    return savedDocument;
  }

  async findAll(query?: any): Promise<Document[]> {
    const {
      type,
      status,
      categoryId,
      projectId,
      clientId,
      supplierId,
      isConfidential,
      tags,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = query || {};

    const queryBuilder = this.documentsRepository.createQueryBuilder('document')
      .leftJoinAndSelect('document.category', 'category')
      .leftJoinAndSelect('document.versions', 'versions');

    if (type) {
      queryBuilder.andWhere('document.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('document.status = :status', { status });
    }

    if (categoryId) {
      queryBuilder.andWhere('document.categoryId = :categoryId', { categoryId });
    }

    if (projectId) {
      queryBuilder.andWhere('document.projectId = :projectId', { projectId });
    }

    if (clientId) {
      queryBuilder.andWhere('document.clientId = :clientId', { clientId });
    }

    if (supplierId) {
      queryBuilder.andWhere('document.supplierId = :supplierId', { supplierId });
    }

    if (isConfidential !== undefined) {
      queryBuilder.andWhere('document.isConfidential = :isConfidential', { isConfidential });
    }

    if (tags) {
      queryBuilder.andWhere('document.tags ILIKE :tags', { tags: `%${tags}%` });
    }

    queryBuilder
      .orderBy(`document.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .limit(limit)
      .offset(offset);

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['category', 'versions'],
    });

    if (!document) {
      throw new NotFoundException(`Document avec l'ID ${id} non trouvé`);
    }

    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    const document = await this.findOne(id);

    Object.assign(document, updateDocumentDto);
    document.updatedAt = new Date();

    return this.documentsRepository.save(document);
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);

    // Supprimer le fichier physique
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Supprimer les versions
    for (const version of document.versions || []) {
      if (fs.existsSync(version.filePath)) {
        fs.unlinkSync(version.filePath);
      }
    }

    await this.documentsRepository.remove(document);
  }

  // Gestion des versions
  async createVersion(documentId: string, file: Express.Multer.File, changeLog?: string): Promise<DocumentVersion> {
    const document = await this.findOne(documentId);
    const maxVersion = await this.versionsRepository.findOne({
      where: { documentId },
      order: { versionNumber: 'DESC' },
    });

    const versionNumber = maxVersion ? maxVersion.versionNumber + 1 : 1;

    const version = this.versionsRepository.create({
      documentId,
      versionNumber,
      filePath: file.path,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      changeLog,
      createdBy: document.updatedBy,
    });

    // Mettre à jour le document principal avec la nouvelle version
    document.version = versionNumber;
    document.filePath = file.path;
    document.fileName = file.originalname;
    document.mimeType = file.mimetype;
    document.fileSize = file.size;
    await this.documentsRepository.save(document);

    return this.versionsRepository.save(version);
  }

  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    return this.versionsRepository.find({
      where: { documentId },
      order: { versionNumber: 'DESC' },
    });
  }

  // Recherche
  async search(searchTerm: string): Promise<Document[]> {
    return this.documentsRepository.find({
      where: [
        { title: Like(`%${searchTerm}%`) },
        { description: Like(`%${searchTerm}%`) },
        { fileName: Like(`%${searchTerm}%`) },
        { tags: Like(`%${searchTerm}%`) },
      ],
      relations: ['category'],
      take: 20,
    });
  }

  // Gestion des catégories
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<DocumentCategory> {
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAllCategories(): Promise<DocumentCategory[]> {
    return this.categoriesRepository.find({
      relations: ['documents'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findCategory(id: string): Promise<DocumentCategory> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['documents'],
    });

    if (!category) {
      throw new NotFoundException(`Catégorie avec l'ID ${id} non trouvée`);
    }

    return category;
  }

  async updateCategory(id: string, updateData: Partial<CreateCategoryDto>): Promise<DocumentCategory> {
    const category = await this.findCategory(id);
    Object.assign(category, updateData);
    return this.categoriesRepository.save(category);
  }

  async removeCategory(id: string): Promise<void> {
    const category = await this.findCategory(id);
    await this.categoriesRepository.remove(category);
  }

  // Méthodes utilitaires
  async getFileBuffer(documentId: string, versionId?: string): Promise<Buffer> {
    let filePath: string;

    if (versionId) {
      const version = await this.versionsRepository.findOne({
        where: { id: versionId, documentId },
      });
      if (!version) {
        throw new NotFoundException('Version non trouvée');
      }
      filePath = version.filePath;
    } else {
      const document = await this.findOne(documentId);
      filePath = document.filePath;
    }

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Fichier physique non trouvé');
    }

    return fs.readFileSync(filePath);
  }

  async getStatistics() {
    const totalDocuments = await this.documentsRepository.count();
    const documentsByType = await this.documentsRepository
      .createQueryBuilder('document')
      .select('document.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('document.type')
      .getRawMany();

    const documentsByStatus = await this.documentsRepository
      .createQueryBuilder('document')
      .select('document.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('document.status')
      .getRawMany();

    const totalSize = await this.documentsRepository
      .createQueryBuilder('document')
      .select('SUM(document.fileSize)', 'totalSize')
      .getRawOne();

    return {
      totalDocuments,
      documentsByType,
      documentsByStatus,
      totalSize: totalSize.totalSize || 0,
    };
  }

  // Méthodes spécifiques pour mobile
  async getRecentDocuments(limit = 10): Promise<Document[]> {
    return this.documentsRepository.find({
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getDocumentsByProject(projectId: string): Promise<Document[]> {
    return this.documentsRepository.find({
      where: { projectId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDocumentsByClient(clientId: string): Promise<Document[]> {
    return this.documentsRepository.find({
      where: { clientId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async getExpiredDocuments(): Promise<Document[]> {
    return this.documentsRepository
      .createQueryBuilder('document')
      .where('document.expiryDate < :now', { now: new Date() })
      .andWhere('document.expiryDate IS NOT NULL')
      .getMany();
  }
} 