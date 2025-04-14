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
    @Query('search') searchQuery?: string,
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

  @Get('client/:clientId')
  async getDocumentsByClientId(
    @Param('clientId') clientId: number,
  ): Promise<Document[]> {
    try {
      return await firstValueFrom(
        this.documentsService.send(
          { cmd: 'get_documents_by_client_id' },
          { clientId },
        ),
      );
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des documents du client ${clientId}:`,
        error,
      );
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
}
