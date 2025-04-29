import { Logger } from '@nestjs/common';
import { PoolClient } from 'pg';
import * as pgClientSource from '../../clients/PgClient';
import pgClientDestination from '../../clients/pgClient_2';
import {
  ConstructionsitereferencedocumentInterface,
  ConstructionsitereferencedocumentexInterface,
} from '../../../EBP_interface/ConstructionSite - Projets/constructionSite';
import EBPclient from '../clients/ebpClient';
import EBPProject from '../projects/ebpProject';
import {
  Document,
  DocumentType,
  DocumentStatus,
} from '../../interfaces/documents/documents.interface';

// Interface pour les objets de base de données
interface DbObject {
  id: number;
  [key: string]: any;
}

// Interface pour les données d'adresse
interface AddressData {
  Address1?: string;
  Address2?: string;
  Address3?: string;
  Address4?: string;
  ZipCode?: string;
  City?: string;
  State?: string;
  CountryIsoCode?: string;
  Longitude?: number;
  Latitude?: number;
}

export default class EBPDocuments {
  private readonly logger = new Logger(EBPDocuments.name);
  private ebpClient: EBPclient;
  private ebpProject: EBPProject;

  constructor() {
    this.ebpClient = new EBPclient();
    this.ebpProject = new EBPProject();
    this.logger.log('EBPDocuments initialized');
  }

  /**
   * Convertit un document EBP en document format application
   */
  async convertToAppDocument(
    ebpDoc: ConstructionsitereferencedocumentInterface,
    ebpDocEx?: ConstructionsitereferencedocumentexInterface,
  ): Promise<Partial<Document> | null> {
    try {
      const destinationClient = await pgClientDestination.getClient();

      // Vérifier si ConstructionSiteId existe
      if (!ebpDoc.ConstructionSiteId) {
        this.logger.warn(
          `Skipping document ${ebpDoc.DocumentNumber}: ConstructionSiteId is missing.`,
        );
        return null;
      }

      const project = await this.getProjectByEbpId(
        ebpDoc.ConstructionSiteId,
        destinationClient,
      );

      if (!project) {
        this.logger.warn(
          `Skipping document ${ebpDoc.DocumentNumber}: Project with EBP ID ${ebpDoc.ConstructionSiteId} not found in destination DB.`,
        );
        return null;
      }

      const projectId = Number(project.id);
      if (isNaN(projectId)) {
        this.logger.warn(
          `Skipping document ${ebpDoc.DocumentNumber}: Invalid project ID.`,
        );
        return null;
      }

      let clientId: number | null = null;
      if (ebpDoc.CustomerId) {
        const client = await this.getClientByEbpId(
          ebpDoc.CustomerId,
          destinationClient,
        );
        if (client) {
          const parsedClientId = Number(client.id);
          if (!isNaN(parsedClientId)) {
            clientId = parsedClientId;
          }
        } else {
          this.logger.warn(
            `Document ${ebpDoc.DocumentNumber}: Client with EBP ID ${ebpDoc.CustomerId} not found. Setting client_id to null.`,
          );
        }
      }

      let approvedByStaffId: number | null = null;
      if (ebpDoc.ColleagueId) {
        const staff = await this.getStaffByEbpId(
          ebpDoc.ColleagueId,
          destinationClient,
        );
        if (staff) {
          const parsedStaffId = Number(staff.id);
          if (!isNaN(parsedStaffId)) {
            approvedByStaffId = parsedStaffId;
          }
        } else {
          this.logger.warn(
            `Document ${ebpDoc.DocumentNumber}: Staff with EBP ID ${ebpDoc.ColleagueId} not found. Setting approved_by_staff_id to null.`,
          );
        }
      }

      let deliveryAddressId: number | null = null;
      if (
        ebpDoc.DeliveryAddress_City &&
        ebpDoc.DeliveryAddress_ZipCode &&
        ebpDoc.DeliveryAddress_Address1
      ) {
        const addressId = await this.upsertAddressFromEbpObject(
          {
            Address1: ebpDoc.DeliveryAddress_Address1,
            Address2: ebpDoc.DeliveryAddress_Address2,
            Address3: ebpDoc.DeliveryAddress_Address3,
            Address4: ebpDoc.DeliveryAddress_Address4,
            ZipCode: ebpDoc.DeliveryAddress_ZipCode,
            City: ebpDoc.DeliveryAddress_City,
            State: ebpDoc.DeliveryAddress_State,
            CountryIsoCode: ebpDoc.DeliveryAddress_CountryIsoCode,
            Longitude: ebpDoc.DeliveryAddress_Longitude,
            Latitude: ebpDoc.DeliveryAddress_Latitude,
          },
          destinationClient,
        );
        if (typeof addressId === 'number' && !isNaN(addressId)) {
          deliveryAddressId = addressId;
        } else {
          this.logger.error(
            `Document ${ebpDoc.DocumentNumber}: Failed to upsert delivery address.`,
          );
        }
      }

      const mappedDoc: Partial<Document> = {
        documentId: ebpDoc.Id,
        project_id: projectId,
        client_id: clientId,
        type: this.mapEbpDocumentType(ebpDoc.DocumentType),
        reference: ebpDoc.DocumentNumber || `EBP_${ebpDoc.Id}`,
        status: this.mapEbpDocumentStatus(
          ebpDoc.ValidationState ?? ebpDoc.DocumentState,
        ),
        amount: ebpDoc.AmountVatExcludedWithDiscountAndShipping,
        tva_rate: ebpDoc.DetailVatAmount0_DetailVatRate,
        issue_date: ebpDoc.DocumentDate,
        due_date: ebpDoc.ValidityDate,
        payment_date: null,
        payment_method: ebpDoc.PaymentTypeId,
        payment_terms: ebpDoc.SettlementModeId,
        discount_rate: ebpDoc.DiscountRate,
        discount_amount: ebpDoc.DiscountAmount,
        payment_status: this.mapEbpPaymentStatus(
          ebpDoc.CommitmentsBalanceDue,
          ebpDoc.TotalDueAmount,
        ),
        amount_paid: ebpDoc.TotalDueAmount - ebpDoc.CommitmentsBalanceDue,
        balance_due: ebpDoc.CommitmentsBalanceDue,
        legal_mentions: null,
        validity_period:
          ebpDoc.ValidityDate && ebpDoc.DocumentDate
            ? Math.round(
                (ebpDoc.ValidityDate.getTime() -
                  ebpDoc.DocumentDate.getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : null,
        signed_by_client: ebpDocEx?.SignatureDate ? true : false,
        signed_date: ebpDocEx?.SignatureDate,
        approved_by_staff_id: approvedByStaffId,
        electronic_signature_path: null,
        version: ebpDoc.sysEditCounter,
        revision_reason: ebpDoc.CorrectionReasonId,
        purchase_order_reference: ebpDocEx?.BuyerReference || null,
        delivery_address_id: deliveryAddressId,
        delivery_date: ebpDoc.DeliveryDate,
        shipping_costs: ebpDoc.ShippingAmountVatExcluded,
        notes: ebpDoc.NotesClear || ebpDoc.Notes,
        file_path: null,
      };

      Object.keys(mappedDoc).forEach((key) => {
        if (mappedDoc[key as keyof Document] === undefined) {
          delete mappedDoc[key as keyof Document];
        }
      });

      return mappedDoc;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la conversion du document ${ebpDoc.DocumentNumber}:`,
        error instanceof Error ? error.message : 'Erreur inconnue',
      );
      return null;
    }
  }

  /**
   * Convertit plusieurs documents EBP en documents format application
   */
  async convertMultipleToAppDocument(
    ebpDocs: ConstructionsitereferencedocumentInterface[],
    ebpDocsEx?: ConstructionsitereferencedocumentexInterface[],
  ): Promise<Partial<Document>[]> {
    const results: Partial<Document>[] = [];

    for (let i = 0; i < ebpDocs.length; i++) {
      const ebpDoc = ebpDocs[i];
      const ebpDocEx = ebpDocsEx ? ebpDocsEx[i] : undefined;

      const convertedDoc = await this.convertToAppDocument(ebpDoc, ebpDocEx);
      if (convertedDoc) {
        results.push(convertedDoc);
      }
    }

    return results;
  }

  /**
   * Récupère tous les documents depuis la base EBP
   */
  async getAllDocumentsFromEBP(): Promise<
    ConstructionsitereferencedocumentInterface[]
  > {
    this.logger.log('Début de getAllDocumentsFromEBP');
    try {
      // Au lieu d'utiliser connect() sur un client déjà connecté, utilisons la fonction executeQuery
      const ebpDocsResult = await pgClientSource.executeQuery(`
        SELECT * FROM "ConstructionSiteReferenceDocument"
      `);

      if (Array.isArray(ebpDocsResult)) {
        this.logger.log(
          `Récupération de ${ebpDocsResult.length} documents depuis EBP`,
        );
        return ebpDocsResult as ConstructionsitereferencedocumentInterface[];
      } else {
        this.logger.warn('Format de résultat inattendu pour les documents');
        return [];
      }
    } catch (error) {
      this.logger.error(
        'Erreur lors de la récupération des documents depuis EBP:',
        error instanceof Error ? error.message : 'Erreur inconnue',
      );
      return [];
    }
  }

  /**
   * Récupère tous les documents étendus depuis la base EBP
   */
  async getAllDocumentsExFromEBP(): Promise<
    ConstructionsitereferencedocumentexInterface[]
  > {
    this.logger.log('Début de getAllDocumentsExFromEBP');
    try {
      // Au lieu d'utiliser connect() sur un client déjà connecté, utilisons la fonction executeQuery
      const ebpDocsExResult = await pgClientSource.executeQuery(`
        SELECT * FROM "ConstructionSiteReferenceDocumentEx"
      `);

      if (Array.isArray(ebpDocsExResult)) {
        this.logger.log(
          `Récupération de ${ebpDocsExResult.length} documents étendus depuis EBP`,
        );
        return ebpDocsExResult as ConstructionsitereferencedocumentexInterface[];
      } else {
        this.logger.warn(
          'Format de résultat inattendu pour les documents étendus',
        );
        return [];
      }
    } catch (error) {
      this.logger.error(
        'Erreur lors de la récupération des documents étendus depuis EBP:',
        error instanceof Error ? error.message : 'Erreur inconnue',
      );
      return [];
    }
  }

  /**
   * Insère un document dans l'application
   */
  async insertDocumentIntoApp(
    documentData: Partial<Document>,
  ): Promise<number | null> {
    this.logger.log(
      `Tentative d'insertion du document ${documentData.reference}`,
    );
    try {
      const destinationClient = await pgClientDestination.getClient();

      // Vérifier si le document existe déjà
      const existingDocResult = await destinationClient.query<DbObject>(
        'SELECT id FROM documents WHERE "documentId" = $1',
        [documentData.documentId],
      );

      if (existingDocResult.rows.length > 0) {
        this.logger.log(
          `Document ${documentData.reference} existe déjà, mise à jour...`,
        );
        const existingDoc = existingDocResult.rows[0];

        // Construire la requête de mise à jour
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1;

        Object.entries(documentData).forEach(([key, value]) => {
          if (key !== 'id' && key !== 'documentId' && value !== undefined) {
            updateFields.push(`"${key}" = $${paramIndex}`);
            updateValues.push(value);
            paramIndex++;
          }
        });

        // Ajouter la date de mise à jour
        updateFields.push(`"updated_at" = NOW()`);

        // Ajouter l'ID du document
        updateValues.push(existingDoc.id);

        const updateQuery = `
          UPDATE documents 
          SET ${updateFields.join(', ')} 
          WHERE id = $${paramIndex}
          RETURNING id
        `;

        const updateResult = await destinationClient.query<DbObject>(
          updateQuery,
          updateValues,
        );

        this.logger.log(
          `Document ${documentData.reference} mis à jour avec succès`,
        );
        return updateResult.rows[0].id;
      } else {
        // Construire la requête d'insertion
        const insertFields: string[] = [];
        const insertValues: any[] = [];
        const paramPlaceholders: string[] = [];
        let paramIndex = 1;

        Object.entries(documentData).forEach(([key, value]) => {
          if (value !== undefined) {
            insertFields.push(`"${key}"`);
            insertValues.push(value);
            paramPlaceholders.push(`$${paramIndex}`);
            paramIndex++;
          }
        });

        // Ajouter les dates de création et mise à jour
        insertFields.push(`"created_at"`, `"updated_at"`);
        insertValues.push(new Date(), new Date());
        paramPlaceholders.push(`NOW()`, `NOW()`);

        const insertQuery = `
          INSERT INTO documents (${insertFields.join(', ')})
          VALUES (${paramPlaceholders.join(', ')})
          RETURNING id
        `;

        const insertResult = await destinationClient.query<DbObject>(
          insertQuery,
          insertValues,
        );

        this.logger.log(
          `Document ${documentData.reference} inséré avec succès`,
        );
        return insertResult.rows[0].id;
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'insertion du document ${documentData.reference}:`,
        error instanceof Error ? error.message : 'Erreur inconnue',
      );
      return null;
    }
  }

  /**
   * Synchronise tous les documents
   */
  async syncAllDocuments(): Promise<{
    success: boolean;
    count: number;
    error?: string;
  }> {
    this.logger.log('Début de la synchronisation des documents');
    const sourceClient: PoolClient | null = null;
    const destinationClient: PoolClient | null = null;
    const transactionCommitted = false;
    let count = 0;

    try {
      // Récupérer les documents depuis EBP
      const ebpDocs = await this.getAllDocumentsFromEBP();
      const ebpDocsEx = await this.getAllDocumentsExFromEBP();

      // Créer un Map pour faciliter la recherche des documents étendus
      const ebpDocsExMap = new Map<
        string,
        ConstructionsitereferencedocumentexInterface
      >();
      ebpDocsEx.forEach((doc) => {
        if (doc.Id) {
          ebpDocsExMap.set(doc.Id, doc);
        }
      });

      // Convertir les documents
      const convertedDocs = await this.convertMultipleToAppDocument(ebpDocs);

      // Insérer les documents
      for (const doc of convertedDocs) {
        if (doc.documentId) {
          const ebpDocEx = ebpDocsExMap.get(doc.documentId);
          const result = await this.insertDocumentIntoApp(doc);
          if (result) {
            count++;
          }
        }
      }

      this.logger.log(
        `Synchronisation terminée avec succès. ${count}/${ebpDocs.length} documents traités.`,
      );
      return { success: true, count };
    } catch (error) {
      this.logger.error(
        'Erreur lors de la synchronisation des documents:',
        error instanceof Error ? error.message : 'Erreur inconnue',
      );
      return {
        success: false,
        count,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    } finally {
      if (sourceClient) {
        sourceClient.release();
      }
      if (destinationClient) {
        destinationClient.release();
      }
    }
  }

  /**
   * Synchronise un document spécifique par son ID EBP
   */
  async syncDocumentByDocumentId(
    documentId: string,
  ): Promise<{ success: boolean; documentId?: number; error?: string }> {
    this.logger.log(
      `Début de la synchronisation du document avec ID EBP ${documentId}`,
    );
    try {
      const sourceClient = await pgClientSource.pgClient.connect();

      // Récupérer le document depuis EBP
      const ebpDocResult =
        await sourceClient.query<ConstructionsitereferencedocumentInterface>(
          'SELECT * FROM "ConstructionSiteReferenceDocument" WHERE "Id" = $1',
          [documentId],
        );

      if (ebpDocResult.rows.length === 0) {
        this.logger.warn(`Document avec ID EBP ${documentId} non trouvé`);
        return {
          success: false,
          error: `Document avec ID EBP ${documentId} non trouvé`,
        };
      }

      const ebpDoc = ebpDocResult.rows[0];

      // Récupérer le document étendu depuis EBP
      const ebpDocExResult =
        await sourceClient.query<ConstructionsitereferencedocumentexInterface>(
          'SELECT * FROM "ConstructionSiteReferenceDocumentEx" WHERE "Id" = $1',
          [documentId],
        );

      const ebpDocEx =
        ebpDocExResult.rows.length > 0 ? ebpDocExResult.rows[0] : undefined;

      // Convertir le document
      const convertedDoc = await this.convertToAppDocument(ebpDoc, ebpDocEx);

      if (!convertedDoc) {
        this.logger.warn(
          `Impossible de convertir le document avec ID EBP ${documentId}`,
        );
        return {
          success: false,
          error: `Impossible de convertir le document avec ID EBP ${documentId}`,
        };
      }

      // Insérer le document
      const result = await this.insertDocumentIntoApp(convertedDoc);

      if (!result) {
        this.logger.warn(
          `Impossible d'insérer le document avec ID EBP ${documentId}`,
        );
        return {
          success: false,
          error: `Impossible d'insérer le document avec ID EBP ${documentId}`,
        };
      }

      this.logger.log(
        `Document avec ID EBP ${documentId} synchronisé avec succès`,
      );
      return { success: true, documentId: result };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la synchronisation du document avec ID EBP ${documentId}:`,
        error instanceof Error ? error.message : 'Erreur inconnue',
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // Fonctions d'aide pour récupérer les données
  private async getClientByEbpId(
    ebpId: string,
    destinationClient: PoolClient,
  ): Promise<DbObject | null> {
    try {
      // Utiliser "customerId" avec la bonne casse
      const result = await destinationClient.query<DbObject>(
        'SELECT id FROM clients WHERE "customerId" = $1',
        [ebpId],
      );
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      return null;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération du client avec EBP ID ${ebpId}:`,
        error instanceof Error ? error.message : 'Erreur inconnue',
      );
      return null;
    }
  }

  private async getProjectByEbpId(
    ebpId: string,
    destinationClient: PoolClient,
  ): Promise<DbObject | null> {
    try {
      // Utiliser "projectId" avec la bonne casse
      const result = await destinationClient.query<DbObject>(
        'SELECT id FROM projects WHERE "projectId" = $1',
        [ebpId],
      );

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération du projet avec EBP ID ${ebpId}:`,
        error instanceof Error ? error.message : 'Erreur inconnue',
      );
      return null;
    }
  }

  private async getStaffByEbpId(
    ebpId: string,
    destinationClient: PoolClient,
  ): Promise<DbObject | null> {
    try {
      // Utiliser "staffId" avec la bonne casse
      const result = await destinationClient.query<DbObject>(
        'SELECT id FROM staff WHERE "staffId" = $1',
        [ebpId],
      );
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      return null;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération du staff avec EBP ID ${ebpId}:`,
        error instanceof Error ? error.message : 'Erreur inconnue',
      );
      return null;
    }
  }

  private async upsertAddressFromEbpObject(
    addressData: AddressData,
    destinationClient: PoolClient,
  ): Promise<number | null> {
    try {
      // Vérifier si l'adresse existe déjà
      const checkResult = await destinationClient.query<DbObject>(
        'SELECT id FROM addresses WHERE address1 = $1 AND zip_code = $2 AND city = $3',
        [
          addressData.Address1 || '',
          addressData.ZipCode || '',
          addressData.City || '',
        ],
      );

      if (checkResult.rows.length > 0) {
        return checkResult.rows[0].id;
      }

      // Insérer la nouvelle adresse
      const insertResult = await destinationClient.query<DbObject>(
        `INSERT INTO addresses (
          address1, address2, address3, address4, zip_code, city, state, country, 
          longitude, latitude
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          addressData.Address1 || '',
          addressData.Address2 || null,
          addressData.Address3 || null,
          addressData.Address4 || null,
          addressData.ZipCode || '',
          addressData.City || '',
          addressData.State || null,
          addressData.CountryIsoCode || 'FR',
          addressData.Longitude || null,
          addressData.Latitude || null,
        ],
      );

      return insertResult.rows[0].id;
    } catch (error) {
      this.logger.error(
        "Erreur lors de l'upsert de l'adresse:",
        error instanceof Error ? error.message : 'Erreur inconnue',
      );
      return null;
    }
  }

  private mapEbpDocumentType(ebpType: number): DocumentType {
    switch (ebpType) {
      case 1:
        return DocumentType.Devis;
      case 2:
        return DocumentType.Facture;
      case 3:
        return DocumentType.BonDeCommande;
      case 4:
        return DocumentType.BonDeLivraison;
      case 5:
        return DocumentType.Avoir;
      case 6:
        return DocumentType.Acompte;
      case 7:
        return DocumentType.Situation;
      default:
        return DocumentType.Autre;
    }
  }

  private mapEbpDocumentStatus(ebpStatus?: number): DocumentStatus {
    switch (ebpStatus) {
      case 0:
        return DocumentStatus.Brouillon;
      case 1:
        return DocumentStatus.EnAttente;
      case 2:
        return DocumentStatus.Valide;
      case 3:
        return DocumentStatus.Refuse;
      case 4:
        return DocumentStatus.Annule;
      default:
        return DocumentStatus.Brouillon;
    }
  }

  private mapEbpPaymentStatus(
    commitmentsBalanceDue: number,
    totalDueAmount: number,
  ): string {
    if (commitmentsBalanceDue <= 0 && totalDueAmount > 0) {
      return 'payé';
    } else if (
      commitmentsBalanceDue > 0 &&
      commitmentsBalanceDue < totalDueAmount
    ) {
      return 'partiellement_payé';
    } else if (commitmentsBalanceDue === totalDueAmount && totalDueAmount > 0) {
      return 'non_payé';
    } else {
      return 'non_applicable';
    }
  }
}
