import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Injectable,
  Param,
  Post,
  Put,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  Document,
  CreateDocumentDto,
  UpdateDocumentDto,
} from '../interfaces/document.interface';
import { firstValueFrom } from 'rxjs';

// Définir ces interfaces ici temporairement, elles devront être déplacées dans un fichier d'interfaces partagé
interface ProjectMedia {
  id: number;
  project_id: number | null;
  stage_id: number | null;
  staff_id: number | null;
  media_type: string | null;
  file_path: string;
  description: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  synced_at: Date | null;
  synced_by_device_id: string | null;
  projects?: any;
  staff?: any;
  project_stages?: any;
}

interface CreateProjectMediaDto {
  project_id?: number | null;
  stage_id?: number | null;
  staff_id?: number | null;
  media_type?: string | null;
  file_path: string;
  description?: string | null;
}

interface UpdateProjectMediaDto {
  project_id?: number | null;
  stage_id?: number | null;
  staff_id?: number | null;
  media_type?: string | null;
  file_path?: string;
  description?: string | null;
}

@Injectable()
@Controller('documents')
export class DocumentsController {
  constructor(
    @Inject('DOCUMENTS_SERVICE') private readonly documentsService: ClientProxy,
  ) {}

  @Get()
  async getAllDocuments(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('searchQuery') searchQuery?: string,
    @Query('clientId') clientId?: number,
    @Query('projectId') projectId?: number,
  ): Promise<Document[]> {
    try {
      return await firstValueFrom(
        this.documentsService.send(
          { cmd: 'get_all_documents' },
          { limit, offset, searchQuery, clientId, projectId },
        ),
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      throw new HttpException(
        'Erreur lors de la récupération des documents',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('client/:clientId')
  async getDocumentsByClientId(
    @Param('clientId') clientId: string,
  ): Promise<Document[]> {
    try {
      const clientIdNumber = parseInt(clientId, 10);
      if (isNaN(clientIdNumber)) {
        throw new HttpException('ID client invalide', HttpStatus.BAD_REQUEST);
      }
      return await firstValueFrom(
        this.documentsService.send(
          { cmd: 'get_documents_by_client_id' },
          { clientId: clientIdNumber },
        ),
      );
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des documents du client ${clientId}:`,
        error,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la récupération des documents du client',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('project/:projectId')
  async getDocumentsByProjectId(
    @Param('projectId') projectId: number,
  ): Promise<Document[]> {
    try {
      return await firstValueFrom(
        this.documentsService.send(
          { cmd: 'get_documents_by_project_id' },
          { projectId },
        ),
      );
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des documents du projet ${projectId}:`,
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération des documents du projet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('media')
  async getAllProjectMedia(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('projectId') projectId?: number,
  ): Promise<ProjectMedia[]> {
    try {
      return await firstValueFrom(
        this.documentsService.send(
          { cmd: 'get_all_project_media' },
          { limit, offset, projectId },
        ),
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des médias:', error);
      throw new HttpException(
        'Erreur lors de la récupération des médias',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('media/:id')
  async getProjectMediaById(@Param('id') id: number): Promise<ProjectMedia> {
    try {
      const media = await firstValueFrom(
        this.documentsService.send({ cmd: 'get_project_media_by_id' }, { id }),
      );
      if (!media) {
        throw new HttpException('Média non trouvé', HttpStatus.NOT_FOUND);
      }
      return media;
    } catch (error) {
      console.error(`Erreur lors de la récupération du média ${id}:`, error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la récupération du média',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('project/:projectId/media')
  async getMediaByProjectId(
    @Param('projectId') projectId: number,
  ): Promise<ProjectMedia[]> {
    try {
      return await firstValueFrom(
        this.documentsService.send(
          { cmd: 'get_media_by_project_id' },
          { projectId },
        ),
      );
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des médias du projet ${projectId}:`,
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération des médias du projet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getDocumentById(@Param('id') id: number): Promise<Document> {
    try {
      const document = await firstValueFrom(
        this.documentsService.send({ cmd: 'get_document_by_id' }, { id }),
      );
      if (!document) {
        throw new HttpException('Document non trouvé', HttpStatus.NOT_FOUND);
      }
      return document;
    } catch (error) {
      console.error(`Erreur lors de la récupération du document ${id}:`, error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la récupération du document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createDocument(
    @Body() createDocumentDto: CreateDocumentDto,
  ): Promise<Document> {
    try {
      return await firstValueFrom(
        this.documentsService.send(
          { cmd: 'create_document' },
          createDocumentDto,
        ),
      );
    } catch (error) {
      console.error('Erreur lors de la création du document:', error);
      throw new HttpException(
        'Erreur lors de la création du document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('media')
  async createProjectMedia(
    @Body() createProjectMediaDto: CreateProjectMediaDto,
  ): Promise<ProjectMedia> {
    try {
      return await firstValueFrom(
        this.documentsService.send(
          { cmd: 'create_project_media' },
          createProjectMediaDto,
        ),
      );
    } catch (error) {
      console.error('Erreur lors de la création du média:', error);
      throw new HttpException(
        'Erreur lors de la création du média',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateDocument(
    @Param('id') id: number,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    try {
      const document = await firstValueFrom(
        this.documentsService.send(
          { cmd: 'update_document' },
          { id, documentDto: updateDocumentDto },
        ),
      );
      if (!document) {
        throw new HttpException('Document non trouvé', HttpStatus.NOT_FOUND);
      }
      return document;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du document ${id}:`, error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la mise à jour du document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('media/:id')
  async updateProjectMedia(
    @Param('id') id: number,
    @Body() updateProjectMediaDto: UpdateProjectMediaDto,
  ): Promise<ProjectMedia> {
    try {
      const media = await firstValueFrom(
        this.documentsService.send(
          { cmd: 'update_project_media' },
          { id, mediaDto: updateProjectMediaDto },
        ),
      );
      if (!media) {
        throw new HttpException('Média non trouvé', HttpStatus.NOT_FOUND);
      }
      return media;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du média ${id}:`, error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la mise à jour du média',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: number): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.documentsService.send({ cmd: 'delete_document' }, { id }),
      );
      if (!result) {
        throw new HttpException('Document non trouvé', HttpStatus.NOT_FOUND);
      }
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du document ${id}:`, error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la suppression du document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('media/:id')
  async deleteProjectMedia(@Param('id') id: number): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.documentsService.send({ cmd: 'delete_project_media' }, { id }),
      );
      if (!result) {
        throw new HttpException('Média non trouvé', HttpStatus.NOT_FOUND);
      }
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du média ${id}:`, error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la suppression du média',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
