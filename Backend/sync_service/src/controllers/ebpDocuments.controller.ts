import { Controller, Get, Param, Logger } from '@nestjs/common';
import { EbpDocumentsService } from '../services/ebpDocuments.service';

@Controller('ebp-documents')
export class EbpDocumentsController {
  private readonly logger = new Logger(EbpDocumentsController.name);

  constructor(private readonly ebpDocumentsService: EbpDocumentsService) {
    this.logger.log('EbpDocumentsController initialized');
  }

  @Get('sync')
  async syncAllDocuments() {
    this.logger.log('Démarrage de la synchronisation des documents');
    return this.ebpDocumentsService.syncAllDocuments();
  }

  @Get('sync/:documentId')
  async syncDocumentByDocumentId(@Param('documentId') documentId: string) {
    this.logger.log(
      `Démarrage de la synchronisation du document avec ID EBP ${documentId}`,
    );
    return this.ebpDocumentsService.syncDocumentByDocumentId(documentId);
  }
}
