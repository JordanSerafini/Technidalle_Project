import { Injectable, Logger } from '@nestjs/common';
import { Document } from '../interfaces/documents/documents.interface';
import {
  ConstructionsitereferencedocumentInterface,
  ConstructionsitereferencedocumentexInterface,
} from '../../EBP_interface/ConstructionSite - Projets/constructionSite';
import EBPDocuments from '../pgToPg/documents/ebpDocuments';

// Interface pour typer les erreurs de synchronisation
export interface SyncErrorDetail {
  identifier: string | number | undefined; // ID du document
  error: string; // Message d'erreur
}

@Injectable()
export class EbpDocumentsService {
  private readonly logger = new Logger(EbpDocumentsService.name);
  private ebpDocuments = new EBPDocuments();

  constructor() {
    this.logger.log('EbpDocumentsService initialized');
  }

  /**
   * Convertit un document EBP en document format application
   */
  async convertEBPDocumentToAppDocument(
    documentEBP: ConstructionsitereferencedocumentInterface,
    documentEBPEx?: ConstructionsitereferencedocumentexInterface,
  ): Promise<Partial<Document> | null> {
    return await this.ebpDocuments.convertToAppDocument(
      documentEBP,
      documentEBPEx,
    );
  }

  /**
   * Convertit une liste de documents EBP en documents format application
   */
  async convertMultipleEBPDocumentsToAppDocuments(
    documentsEBP: ConstructionsitereferencedocumentInterface[],
    documentsEBPEx?: ConstructionsitereferencedocumentexInterface[],
  ): Promise<Partial<Document>[]> {
    return await this.ebpDocuments.convertMultipleToAppDocument(
      documentsEBP,
      documentsEBPEx,
    );
  }

  /**
   * Synchronise tous les documents depuis EBP vers l'application
   * Récupère les documents depuis la base EBP, les convertit, et les insère dans la base App
   */
  async syncAllDocuments(): Promise<{
    success: boolean;
    count: number;
    errors?: SyncErrorDetail[];
  }> {
    try {
      this.logger.log('Démarrage de la synchronisation des documents');

      // Récupérer tous les documents depuis EBP
      const documentsEBP = await this.ebpDocuments.getAllDocumentsFromEBP();
      const documentsEBPEx = await this.ebpDocuments.getAllDocumentsExFromEBP();
      this.logger.log(`${documentsEBP.length} documents récupérés depuis EBP`);

      // Convertir les documents au format App
      const documentsApp = await this.convertMultipleEBPDocumentsToAppDocuments(
        documentsEBP,
        documentsEBPEx,
      );

      // Insérer les documents dans la base App
      const errors: SyncErrorDetail[] = [];
      let successCount = 0;

      for (const documentApp of documentsApp) {
        try {
          const documentId =
            await this.ebpDocuments.insertDocumentIntoApp(documentApp);
          this.logger.log(`Document inséré avec l'ID: ${documentId}`);
          successCount++;
        } catch (error) {
          this.logger.error(
            `Erreur lors de l'insertion du document: ${documentApp.reference}`,
            error,
          );
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Erreur inconnue lors de l'insertion du document";
          errors.push({
            identifier: documentApp.reference,
            error: errorMessage,
          });
        }
      }

      this.logger.log(
        `Synchronisation terminée: ${successCount}/${documentsApp.length} documents synchronisés`,
      );

      return {
        success: true,
        count: successCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error(
        'Erreur lors de la synchronisation des documents',
        error,
      );
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur inconnue lors de la synchronisation des documents';
      return {
        success: false,
        count: 0,
        errors: [{ identifier: 'global', error: errorMessage }],
      };
    }
  }

  /**
   * Synchronise un document spécifique par son ID EBP
   */
  async syncDocumentByDocumentId(documentId: string): Promise<{
    success: boolean;
    documentId?: number;
    error?: string;
  }> {
    try {
      this.logger.log(
        `Démarrage de la synchronisation du document avec ID EBP ${documentId}`,
      );
      return await this.ebpDocuments.syncDocumentByDocumentId(documentId);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la synchronisation du document avec ID EBP ${documentId}`,
        error,
      );
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur inconnue lors de la synchronisation du document';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
