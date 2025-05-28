import { Logger } from '@nestjs/common';
import { PoolClient, DatabaseError } from 'pg';
import * as pgClientSource from '../../clients/PgClient';
import PgClient2 from '../../clients/pgClient_2';
import {
  ConstructionsitereferencedocumentInterface,
  ConstructionsitereferencedocumentexInterface,
} from '../../../EBP_interface/ConstructionSite - Projets/constructionSite';
import {
  DealsaledocumentlineInterface,
  DealpurchasedocumentlineInterface,
} from '../../interfaces/Deal/deal.interface';
import EBPclient from '../clients/ebpClient';
import EBPProject from '../projects/ebpProject';
import {
  Document,
  DocumentType,
  DocumentStatus,
} from '../../interfaces/documents/documents.interface';
import { QueryService } from '../../services/query.service';
import { ClientSyncService } from '../../services/client-sync.service';

// Interface for application document lines
interface AppDocumentLine {
  document_id: number; // Link to the parent document in the app DB
  material_id?: number; // Link to the material in the app DB
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate?: number;
  total_ht?: number; // This will likely be calculated or mapped from EBP total
  sort_order?: number;
  created_at?: Date;
  updated_at?: Date;
  // Add a field to store the original EBP line ID for tracking
  ebp_line_id: string;
}

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
  private queryService: QueryService;
  private clientSyncService: ClientSyncService;

  constructor(
    queryService: QueryService,
    clientSyncService: ClientSyncService,
  ) {
    this.ebpClient = new EBPclient();
    this.queryService = queryService;
    this.clientSyncService = clientSyncService;
    this.ebpProject = new EBPProject(queryService, clientSyncService);
    this.logger.log('EBPDocuments initialized');
  }

  /**
   * Convertit un document EBP en document format application
   */
  async convertToAppDocument(
    ebpDoc: ConstructionsitereferencedocumentInterface,
    ebpDocEx?: ConstructionsitereferencedocumentexInterface,
  ): Promise<Partial<Document> | null> {
    let destinationClient: PoolClient | null = null;
    try {
      destinationClient = await PgClient2.getClient();
      if (!destinationClient) {
        this.logger.error(
          "Impossible d'obtenir un client de la pool de destination.",
        );
        return null;
      }

      let project: DbObject | null = null;
      if (ebpDoc.ConstructionSiteId) {
        project = await this.getProjectByEbpId(
          ebpDoc.ConstructionSiteId,
          destinationClient,
        );
      } else if (ebpDoc.DealId) {
        project = await this.getProjectByDealId(
          ebpDoc.DealId,
          destinationClient,
        );
      }
      if (!project) {
        this.logger.warn(
          `Skipping document ${ebpDoc.DocumentNumber}: Project not found for ConstructionSiteId or DealId.`,
        );
        return null;
      }

      // Log de debug détaillé pour le mapping document <-> projet
      this.logger.debug(
        `[DEBUG] Mapping document ${ebpDoc.DocumentNumber} (ref: ${ebpDoc.Reference}) vers projet: id=${project?.id}, ref=${project?.reference}, via ConstructionSiteId=${ebpDoc.ConstructionSiteId} ou DealId=${ebpDoc.DealId}`,
      );

      const projectId = Number(project.id);
      this.logger.debug(
        `[Doc ${ebpDoc.DocumentNumber}] Found project App ID: ${projectId}`,
      );
      if (isNaN(projectId)) {
        this.logger.warn(
          `Skipping document ${ebpDoc.DocumentNumber}: Invalid project ID.`,
        );
        return null;
      }

      let clientId: number | null = null;
      if (ebpDoc.CustomerId) {
        this.logger.debug(
          `[Doc ${ebpDoc.DocumentNumber}] Looking up client with EBP ID: ${ebpDoc.CustomerId}`,
        );
        const client = await this.getClientByEbpId(
          ebpDoc.CustomerId,
          destinationClient,
        );
        if (client) {
          const parsedClientId = Number(client.id);
          if (!isNaN(parsedClientId)) {
            clientId = parsedClientId;
            this.logger.debug(
              `[Doc ${ebpDoc.DocumentNumber}] Found client App ID: ${clientId}`,
            );
          }
        } else {
          this.logger.warn(
            `Document ${ebpDoc.DocumentNumber}: Client with EBP ID ${ebpDoc.CustomerId} not found. Setting client_id to null.`,
          );
        }
      }

      let approvedByStaffId: number | null = null;
      if (ebpDoc.ColleagueId) {
        this.logger.debug(
          `[Doc ${ebpDoc.DocumentNumber}] Looking up staff with EBP ID: ${ebpDoc.ColleagueId}`,
        );
        const staff = await this.getStaffByEbpId(
          ebpDoc.ColleagueId,
          destinationClient,
        );
        if (staff) {
          const parsedStaffId = Number(staff.id);
          if (!isNaN(parsedStaffId)) {
            approvedByStaffId = parsedStaffId;
            this.logger.debug(
              `[Doc ${ebpDoc.DocumentNumber}] Found staff App ID: ${approvedByStaffId}`,
            );
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
        amount: ebpDoc.AmountVatExcludedWithDiscount,
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
        signed_by_client: !!ebpDocEx?.SignatureDate,
        signed_date: ebpDocEx?.SignatureDate,
        approved_by_staff_id: approvedByStaffId,
        electronic_signature_path: null,
        version: ebpDoc.sysEditCounter ?? 1,
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
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    } finally {
      if (destinationClient) {
        destinationClient.release();
      }
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
      // Utiliser la fonction executeQuery qui gère la connexion/libération
      const ebpDocsResult = await pgClientSource.executeQuery(`
        SELECT * FROM "ConstructionSiteReferenceDocument"
      `);

      // pgClientSource.executeQuery devrait retourner un tableau ou lancer une erreur
      this.logger.log(
        `Récupération de ${ebpDocsResult.length} documents depuis EBP`,
      );
      // Nous devons nous assurer que le type retourné est correct, même sans générique
      // Une assertion de type peut être nécessaire si executeQuery retourne 'any'
      return ebpDocsResult as ConstructionsitereferencedocumentInterface[];
    } catch (error) {
      this.logger.error(
        'Erreur lors de la récupération des documents depuis EBP:',
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
      return []; // Retourner un tableau vide en cas d'erreur
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
      const ebpDocsExResult = await pgClientSource.executeQuery(`
        SELECT * FROM "ConstructionSiteReferenceDocumentEx"
      `);
      this.logger.log(
        `Récupération de ${ebpDocsExResult.length} documents étendus depuis EBP`,
      );
      // Assertion de type ici aussi
      return ebpDocsExResult as ConstructionsitereferencedocumentexInterface[];
    } catch (error) {
      this.logger.error(
        'Erreur lors de la récupération des documents étendus depuis EBP:',
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
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
      `Tentative d'insertion/mise à jour du document ${documentData.reference}`,
    );
    let destinationClient: PoolClient | null = null;
    try {
      destinationClient = await PgClient2.getClient();
      if (!destinationClient) {
        this.logger.error(
          "Impossible d'obtenir un client de la pool de destination pour insertDocumentIntoApp.",
        );
        return null;
      }

      // Vérifier si le document existe déjà par document_id (qui devrait être unique)
      const existingDocResult = await destinationClient.query<{ id: number }>(
        'SELECT id FROM documents WHERE "document_id" = $1',
        [documentData.documentId],
      );

      if (existingDocResult.rows.length > 0) {
        const existingId = existingDocResult.rows[0].id;
        this.logger.log(
          `Document ${documentData.reference} (ID EBP: ${documentData.documentId}) existe déjà (ID App: ${existingId}), mise à jour...`,
        );

        // Construire la requête de mise à jour
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1;

        // Utiliser Object.keys pour itérer sur les clés de Partial<Document>
        Object.keys(documentData).forEach((key) => {
          const typedKey = key as keyof Document;
          // Exclure id et documentId des mises à jour directes, et les valeurs undefined
          if (
            typedKey !== 'id' &&
            typedKey !== 'documentId' &&
            documentData[typedKey] !== undefined
          ) {
            // S'assurer que la clé est bien une colonne de la table 'documents' pour éviter les erreurs SQL.
            // Conversion clé TS (camelCase) vers clé SQL (snake_case) si nécessaire pour la requête.
            // Ici, on suppose que les autres clés correspondent déjà (ex: project_id -> "project_id")
            // Mais si ce n'était pas le cas, il faudrait une fonction de mapping ici.
            // Pour document_id, on l'exclut explicitement.
            updateFields.push(`"${key}" = $${paramIndex}`); // Utilise la clé telle quelle (devrait correspondre aux colonnes SQL sauf pour documentId)
            updateValues.push(documentData[typedKey]);
            paramIndex++;
          }
        });

        if (updateFields.length === 0) {
          this.logger.log(
            `Aucun champ à mettre à jour pour le document ${documentData.reference}.`,
          );
          return existingId; // Retourner l'ID existant si aucune mise à jour n'est nécessaire
        }

        updateFields.push(`"updated_at" = NOW()`); // Mettre à jour la date de modification
        updateValues.push(existingId); // Valeur pour la clause WHERE

        const updateQuery = `
          UPDATE documents
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING id
        `;

        const updateResult = await destinationClient.query<{ id: number }>(
          updateQuery,
          updateValues,
        );

        if (updateResult.rows.length > 0) {
          this.logger.log(
            `Document ${documentData.reference} mis à jour avec succès (ID App: ${updateResult.rows[0].id})`,
          );
          return updateResult.rows[0].id;
        } else {
          this.logger.error(
            `Échec de la mise à jour du document ${documentData.reference} (ID App: ${existingId}). Aucun ID retourné.`,
          );
          return null;
        }
      } else {
        // Le document n'existe pas, procéder à l'insertion
        this.logger.log(
          `Document ${documentData.reference} (ID EBP: ${documentData.documentId}) non trouvé, insertion...`,
        );
        // Construire la requête d'insertion
        const insertFields: string[] = [];
        const insertValues: any[] = [];
        const paramPlaceholders: string[] = [];
        let paramIndex = 1;

        Object.keys(documentData).forEach((key) => {
          const typedKey = key as keyof Document;
          if (documentData[typedKey] !== undefined) {
            // Mapper la clé camelCase (documentId) vers snake_case (document_id) pour la requête SQL
            const sqlColumnName = key === 'documentId' ? 'document_id' : key;
            insertFields.push(`"${sqlColumnName}"`);
            insertValues.push(documentData[typedKey]);
            paramPlaceholders.push(`$${paramIndex}`);
            paramIndex++;
          }
        });

        // Ajouter created_at et updated_at pour les nouvelles insertions
        if (!insertFields.includes('"created_at"')) {
          insertFields.push(`"created_at"`);
          paramPlaceholders.push(`$${paramIndex}`);
          insertValues.push(new Date());
          paramIndex++;
        }
        if (!insertFields.includes('"updated_at"')) {
          insertFields.push(`"updated_at"`);
          paramPlaceholders.push(`$${paramIndex}`);
          insertValues.push(new Date());
          paramIndex++;
        }

        const insertQuery = `
          INSERT INTO documents (${insertFields.join(', ')})
          VALUES (${paramPlaceholders.join(', ')})
          RETURNING id
        `;

        const insertResult = await destinationClient.query<{ id: number }>(
          insertQuery,
          insertValues,
        );

        if (insertResult.rows.length > 0) {
          this.logger.log(
            `Document ${documentData.reference} inséré avec succès (ID App: ${insertResult.rows[0].id})`,
          );
          return insertResult.rows[0].id;
        } else {
          this.logger.error(
            `Échec de l'insertion du document ${documentData.reference}. Aucun ID retourné.`,
          );
          return null;
        }
      }
    } catch (error) {
      const typedError = error as DatabaseError; // Typer l'erreur
      this.logger.error(
        `Erreur lors de l'insertion/mise à jour du document ${documentData.reference} (ID EBP: ${documentData.documentId}): ${typedError.message}`,
        `Code: ${typedError.code}, Table: ${typedError.table}, Colonne: ${typedError.column}, Contrainte: ${typedError.constraint}`,
        typedError.stack, // Stack trace complet
      );
      return null;
    } finally {
      if (destinationClient) {
        destinationClient.release(); // Toujours libérer le client
      }
    }
  }

  /**
   * Synchronise tous les documents
   */
  async syncAllDocuments(): Promise<{
    success: boolean;
    count: number;
    total: number;
    errors: { identifier: string; error: string }[];
  }> {
    let ebpDocs: ConstructionsitereferencedocumentInterface[] = [];
    let ebpDocsEx: ConstructionsitereferencedocumentexInterface[] = [];
    let ebpSaleLines: DealsaledocumentlineInterface[] = [];
    let ebpPurchaseLines: DealpurchasedocumentlineInterface[] = [];
    let allEbpLines: (
      | DealsaledocumentlineInterface
      | DealpurchasedocumentlineInterface
    )[] = [];
    let client: PoolClient | null = null;
    let total = 0;
    let count = 0;
    const errors: { identifier: string; error: string }[] = [];

    try {
      ebpDocs = await this.getAllDocumentsFromEBP();
      ebpDocsEx = await this.getAllDocumentsExFromEBP();
      ebpSaleLines = await this.getAllSaleDocumentLinesFromEBP();
      ebpPurchaseLines = await this.getAllPurchaseDocumentLinesFromEBP();
      allEbpLines = [...ebpSaleLines, ...ebpPurchaseLines];
      total = ebpDocs.length;
      client = await PgClient2.getClient();

      this.logger.log(`Début de la synchronisation de ${total} documents`);

      for (const ebpDoc of ebpDocs) {
        const identifier = ebpDoc.DocumentNumber || ebpDoc.Id || 'ID_INCONNU';
        try {
          const ebpDocEx = ebpDocsEx.find((ex) => ex.Id === ebpDoc.Id);
          const appDoc = await this.convertToAppDocument(ebpDoc, ebpDocEx);

          if (appDoc) {
            const insertedId = await this.insertDocumentIntoApp(appDoc);
            if (insertedId && client) {
              count++;
              if (count % 50 === 0 || count === total) {
                this.logger.log(
                  `Progression: ${count}/${total} documents traités`,
                );
              }

              // Synchronisation des lignes de documents
              const relatedEbpLines = allEbpLines.filter(
                (
                  line:
                    | DealsaledocumentlineInterface
                    | DealpurchasedocumentlineInterface,
                ) =>
                  line &&
                  typeof line === 'object' &&
                  'DocumentId' in line &&
                  line.DocumentId === ebpDoc.Id,
              );
              this.logger.debug(
                `Found ${relatedEbpLines.length} lines for document EBP ID ${ebpDoc.Id}`,
              );

              for (const ebpLine of relatedEbpLines) {
                try {
                  const appDocumentLine =
                    await this.mapEbpDocumentLineToAppDocumentLine(
                      ebpLine,
                      insertedId,
                    );

                  if (appDocumentLine) {
                    const documentLineId = await this.upsertDocumentLine(
                      appDocumentLine,
                      client,
                    );
                    if (!documentLineId) {
                      errors.push({
                        identifier: `Ligne ${'Id' in ebpLine ? ebpLine.Id : 'INCONNU'} pour document ${identifier}`,
                        error: "Échec de l'insertion/màj de la ligne",
                      });
                    } else {
                      this.logger.debug(
                        `Ligne EBP ${'Id' in ebpLine ? ebpLine.Id : 'INCONNU'} synchronisée avec succès (ID App: ${documentLineId})`,
                      );
                    }
                  } else {
                    errors.push({
                      identifier: `Ligne ${'Id' in ebpLine ? ebpLine.Id : 'INCONNU'} pour document ${identifier}`,
                      error: 'Échec du mappage de la ligne',
                    });
                  }
                } catch (lineError) {
                  const errMsg =
                    lineError instanceof Error
                      ? lineError.message
                      : String(lineError);
                  this.logger.error(
                    `Erreur lors de la synchronisation de la ligne EBP ${'Id' in ebpLine ? ebpLine.Id : 'INCONNU'} pour document ${identifier}: ${errMsg}`,
                    lineError instanceof Error ? lineError.stack : undefined,
                  );
                  errors.push({
                    identifier: `Ligne ${'Id' in ebpLine ? ebpLine.Id : 'INCONNU'} pour document ${identifier}`,
                    error: `Erreur lors du traitement de la ligne: ${errMsg}`,
                  });
                }
              }
            } else if (!insertedId) {
              errors.push({
                identifier,
                error: `Échec de l'insertion/màj pour le document ${identifier}`,
              });
            }
          } else {
            errors.push({
              identifier,
              error: `Échec de la conversion pour le document ${identifier}`,
            });
          }
        } catch (docError) {
          const errorMessage =
            docError instanceof Error ? docError.message : String(docError);
          this.logger.error(
            `Erreur majeure lors de la synchronisation du document ${identifier}: ${errorMessage}`,
            docError instanceof Error ? docError.stack : undefined,
          );
          errors.push({ identifier, error: `Erreur majeure: ${errorMessage}` });
        }
      }

      this.logger.log(
        `Synchronisation terminée. ${count} documents traités sur ${total}. ${errors.length} erreurs rencontrées.`,
      );
      return { success: errors.length === 0, count, total, errors };
    } catch (globalError) {
      const errorMessage =
        globalError instanceof Error
          ? globalError.message
          : String(globalError);
      this.logger.error(
        `Erreur globale lors de la synchronisation des documents: ${errorMessage}`,
        globalError instanceof Error ? globalError.stack : undefined,
      );
      return {
        success: false,
        count: 0,
        total: ebpDocs.length,
        errors: [{ identifier: 'GLOBAL', error: errorMessage }],
      };
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Synchronise un document spécifique par son ID EBP
   */
  async syncDocumentByDocumentId(
    documentIdEBP: string,
  ): Promise<{ success: boolean; documentId?: number; error?: string }> {
    this.logger.log(
      `Début de la synchronisation du document avec ID EBP ${documentIdEBP}`,
    );
    try {
      // Récupérer le document depuis EBP en utilisant pgClientSource.executeQuery
      const ebpDocResult = await pgClientSource.executeQuery(
        'SELECT * FROM "ConstructionSiteReferenceDocument" WHERE "Id" = $1',
        [documentIdEBP],
      );

      if (!ebpDocResult || ebpDocResult.length === 0) {
        this.logger.warn(`Document avec ID EBP ${documentIdEBP} non trouvé`);
        return {
          success: false,
          error: `Document avec ID EBP ${documentIdEBP} non trouvé`,
        };
      }

      const ebpDoc =
        ebpDocResult[0] as ConstructionsitereferencedocumentInterface;

      // Récupérer le document étendu depuis EBP
      const ebpDocExResult = await pgClientSource.executeQuery(
        'SELECT * FROM "ConstructionSiteReferenceDocumentEx" WHERE "Id" = $1',
        [documentIdEBP],
      );

      const ebpDocEx =
        ebpDocExResult && ebpDocExResult.length > 0
          ? (ebpDocExResult[0] as ConstructionsitereferencedocumentexInterface)
          : undefined;

      // Convertir le document
      const convertedDoc = await this.convertToAppDocument(ebpDoc, ebpDocEx);

      if (!convertedDoc) {
        this.logger.warn(
          `Impossible de convertir le document avec ID EBP ${documentIdEBP}`,
        );
        return {
          success: false,
          error: `Impossible de convertir le document avec ID EBP ${documentIdEBP}`,
        };
      }

      // Insérer le document
      const result = await this.insertDocumentIntoApp(convertedDoc);

      if (!result) {
        this.logger.warn(
          `Impossible d'insérer le document avec ID EBP ${documentIdEBP}`,
        );
        return {
          success: false,
          error: `Impossible d'insérer le document avec ID EBP ${documentIdEBP}`,
        };
      }

      this.logger.log(
        `Document avec ID EBP ${documentIdEBP} synchronisé avec succès`,
      );
      return { success: true, documentId: result };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la synchronisation du document avec ID EBP ${documentIdEBP}:`,
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
    this.logger.debug(`getClientByEbpId called with EBP ID: ${ebpId}`);
    try {
      const result = await destinationClient.query<{
        id: number;
        customer_id: string;
      }>('SELECT id, "customer_id" FROM clients WHERE "customer_id" = $1', [
        ebpId,
      ]);
      if (result.rows.length > 0) {
        this.logger.debug(
          `getClientByEbpId: Found client App ID ${result.rows[0].id} for EBP ID ${ebpId}`,
        );
        return result.rows[0];
      } else {
        this.logger.warn(
          `getClientByEbpId: No client found for EBP ID ${ebpId}`,
        );
        return null;
      }
    } catch (error) {
      const typedError = error as DatabaseError;
      this.logger.error(
        `Erreur lors de la récupération du client avec l'ID EBP ${ebpId}: ${typedError.message}`,
        `Code: ${typedError.code}`,
        typedError.stack,
      );
      return null;
    }
  }

  private async getProjectByEbpId(
    ebpId: string,
    destinationClient: PoolClient,
  ): Promise<DbObject | null> {
    // Recherche uniquement sur la colonne 'reference' (PRJxxxx ou AFFxxxxx)
    const result = await destinationClient.query<{ id: number }>(
      'SELECT id FROM projects WHERE reference = $1',
      [ebpId],
    );
    return result.rows[0] || null;
  }

  private async getProjectByDealId(
    dealId: string,
    destinationClient: PoolClient,
  ): Promise<DbObject | null> {
    // Recherche uniquement sur la colonne 'reference' (AFFxxxxx)
    const result = await destinationClient.query<{ id: number }>(
      'SELECT id FROM projects WHERE reference = $1',
      [dealId],
    );
    return result.rows[0] || null;
  }

  private async getStaffByEbpId(
    ebpId: string,
    destinationClient: PoolClient,
  ): Promise<DbObject | null> {
    this.logger.debug(`getStaffByEbpId called with EBP ID: ${ebpId}`);
    try {
      const result = await destinationClient.query<{
        id: number;
        staff_id: string;
      }>('SELECT id, "staff_id" FROM staff WHERE "staff_id" = $1', [ebpId]);
      if (result.rows.length > 0) {
        this.logger.debug(
          `getStaffByEbpId: Found staff App ID ${result.rows[0].id} for EBP ID ${ebpId}`,
        );
        return result.rows[0];
      } else {
        this.logger.warn(`getStaffByEbpId: No staff found for EBP ID ${ebpId}`);
        return null;
      }
    } catch (error) {
      const typedError = error as DatabaseError;
      this.logger.error(
        `Erreur lors de la récupération du staff avec l'ID EBP ${ebpId}: ${typedError.message}`,
        `Code: ${typedError.code}`,
        typedError.stack,
      );
      return null;
    }
  }

  private async upsertAddressFromEbpObject(
    addressData: AddressData,
    destinationClient: PoolClient,
  ): Promise<number | null> {
    // 1. Normalisation et validation des données d'entrée
    const address1 = addressData.Address1?.trim() || '';
    const address2 = addressData.Address2?.trim() || '';
    const address3 = addressData.Address3?.trim() || '';
    const address4 = addressData.Address4?.trim() || '';

    let streetNumber: string | null = null;
    let streetName: string = address1; // Par défaut, address1 est le nom de rue

    // 2. Extraction du numéro de rue (si présent au début de address1)
    const streetParts = address1.match(/^(\d{1,9}[a-zA-Z]?)\s+(.*)/);
    if (streetParts) {
      const potentialNumber = streetParts[1];
      if (potentialNumber.length <= 10) {
        streetNumber = potentialNumber;
        streetName = streetParts[2].trim();
      }
    }

    // Default pour nom de rue vide
    if (!streetName) {
      streetName = 'Adresse non spécifiée';
    }

    const additionalAddress = [address2, address3, address4]
      .filter((part) => part)
      .join(', ')
      .trim();

    const zipCode = addressData.ZipCode?.trim() || '';
    const city = addressData.City?.trim() || '';
    const country = addressData.CountryIsoCode?.trim() || 'France';
    const longitude = addressData.Longitude;
    const latitude = addressData.Latitude;

    // 3. Validation des champs essentiels
    if (!zipCode || !city) {
      this.logger.warn(
        `Adresse incomplète ignorée (CP ou Ville manquant): Rue='${streetName}', CP='${zipCode}', Ville='${city}'`,
      );
      return null;
    }
    // Ajout d'une vérification simple de la longueur pour éviter les erreurs de contrainte (peut être affiné)
    if (zipCode.length > 10) {
      this.logger.warn(
        `Code Postal "${zipCode}" trop long pour l'adresse Rue='${streetName}', Ville='${city}'. Adresse ignorée.`,
      );
      return null;
    }

    this.logger.debug(
      `Upsert Adresse: Num='${streetNumber}', Rue='${streetName}', Compl='${additionalAddress}', CP='${zipCode}', Ville='${city}', Pays='${country}'`,
    );

    // 4. Utilisation du pattern SELECT puis INSERT ON CONFLICT
    const selectQuery = `
      SELECT id FROM addresses WHERE
        (street_number = $1 OR ($1 IS NULL AND street_number IS NULL)) AND
        street_name = $2 AND
        zip_code = $3 AND
        city = $4 AND
        (additional_address = $5 OR ($5 IS NULL AND additional_address IS NULL)) AND
        country = $6
      LIMIT 1
    `;
    const selectValues = [
      streetNumber,
      streetName,
      zipCode,
      city,
      additionalAddress || null, // Utiliser NULL si vide
      country,
    ];

    try {
      // Essayer de trouver l'adresse existante
      const selectResult = await destinationClient.query<{ id: number }>(
        selectQuery,
        selectValues,
      );

      if (selectResult.rows.length > 0 && selectResult.rows[0].id) {
        this.logger.debug(
          `Adresse existante trouvée (SELECT): ID ${selectResult.rows[0].id}`,
        );
        return selectResult.rows[0].id;
      }

      // Si non trouvée, essayer d'insérer
      this.logger.debug("Adresse non trouvée, tentative d'insertion...");
      const insertQuery = `
        INSERT INTO addresses (street_number, street_name, additional_address, zip_code, city, country, longitude, latitude)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (street_number, street_name, zip_code, city) DO NOTHING -- Gère la contrainte unique
        RETURNING id
      `;
      const insertValues = [
        streetNumber,
        streetName,
        additionalAddress || null,
        zipCode,
        city,
        country,
        longitude,
        latitude,
      ];

      const insertResult = await destinationClient.query<{ id: number }>(
        insertQuery,
        insertValues,
      );

      if (insertResult.rows.length > 0 && insertResult.rows[0].id) {
        this.logger.debug(
          `Nouvelle adresse insérée (INSERT): ID ${insertResult.rows[0].id}`,
        );
        return insertResult.rows[0].id;
      }

      // Si l'insertion n'a rien retourné (ON CONFLICT DO NOTHING a été activé par une race condition)
      // Re-sélectionner pour obtenir l'ID
      this.logger.debug(
        "Insertion n'a pas retourné d'ID (conflit détecté), re-sélection...",
      );
      const reSelectResult = await destinationClient.query<{ id: number }>(
        selectQuery,
        selectValues,
      );

      if (reSelectResult.rows.length > 0 && reSelectResult.rows[0].id) {
        this.logger.debug(
          `Adresse existante trouvée (re-SELECT): ID ${reSelectResult.rows[0].id}`,
        );
        return reSelectResult.rows[0].id;
      } else {
        // Cas très improbable
        this.logger.error(
          "ERREUR CRITIQUE: Impossible de trouver ou d'insérer l'adresse après gestion de conflit.",
          { selectValues },
        );
        return null;
      }
    } catch (error) {
      const typedError = error as DatabaseError;
      this.logger.error(
        `Erreur BDD inattendue lors de l'upsert adresse: ${typedError.message}`,
        `Code: ${typedError.code}, Rue: ${streetName}, CP: ${zipCode}, Ville: ${city}`,
        typedError.stack,
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

  /**
   * Récupère toutes les lignes de documents de vente depuis la base EBP
   */
  async getAllSaleDocumentLinesFromEBP(): Promise<
    DealsaledocumentlineInterface[]
  > {
    this.logger.log('Début de getAllSaleDocumentLinesFromEBP');
    try {
      const ebpLinesResult = await pgClientSource.executeQuery(`
        SELECT * FROM "DealSaleDocumentLine"
      `);

      this.logger.log(
        `Récupération de ${ebpLinesResult.length} lignes de documents de vente depuis EBP`,
      );
      // Assuming executeQuery returns array of rows directly
      return ebpLinesResult as DealsaledocumentlineInterface[];
    } catch (error) {
      this.logger.error(
        'Erreur lors de la récupération des lignes de documents de vente depuis EBP:',
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
      // Return an empty array or re-throw depending on desired error handling
      return [];
    }
  }

  /**
   * Récupère toutes les lignes de documents d'achat depuis la base EBP
   */
  async getAllPurchaseDocumentLinesFromEBP(): Promise<
    DealpurchasedocumentlineInterface[]
  > {
    this.logger.log('Début de getAllPurchaseDocumentLinesFromEBP');
    try {
      const ebpLinesResult = await pgClientSource.executeQuery(`
        SELECT * FROM "DealPurchaseDocumentLine"
      `);

      this.logger.log(
        `Récupération de ${ebpLinesResult.length} lignes de documents d'achat depuis EBP`,
      );
      // Assuming executeQuery returns array of rows directly
      return ebpLinesResult as DealpurchasedocumentlineInterface[];
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des lignes de documents d'achat depuis EBP:",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
      // Return an empty array or re-throw depending on desired error handling
      return [];
    }
  }

  /**
   * Mappe une ligne de document EBP (vente ou achat) vers la structure de l'application
   * @param ebpLine Ligne de document EBP
   * @param appDocumentId L'ID du document parent dans la base de l'application
   * @returns Ligne de document format application ou null si mappage impossible
   */
  async mapEbpDocumentLineToAppDocumentLine(
    ebpLine: DealsaledocumentlineInterface | DealpurchasedocumentlineInterface,
    appDocumentId: number,
  ): Promise<AppDocumentLine | null> {
    if (
      !ebpLine.Id ||
      !ebpLine.DocumentId ||
      ebpLine.Quantity === undefined ||
      ebpLine.PurchasePrice === undefined
    ) {
      this.logger.warn(
        `Ligne de document EBP manquante en champs requis (Id, DocumentId, Quantity, PurchasePrice): ${JSON.stringify(ebpLine)}`,
      );
      return null;
    }

    let materialId: number | undefined = undefined;
    if (ebpLine.ItemId) {
      try {
        const materialResult = await this.queryService.executeQuery<{
          id: number;
        }>('SELECT id FROM materials WHERE reference = $1', [ebpLine.ItemId]);
        if (materialResult.rows.length > 0 && materialResult.rows[0].id) {
          materialId = materialResult.rows[0].id;
        } else {
          this.logger.warn(
            `Matériel EBP avec ItemId ${ebpLine.ItemId} non trouvé dans la base App. La ligne de document sera liée sans matériel.`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Erreur lors de la recherche du matériel pour ItemId ${ebpLine.ItemId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const quantity = Number(ebpLine.Quantity) || 0;
    const unitPrice = Number(ebpLine.PurchasePrice) || 0;

    // Calcul du montant total HT (NetAmountVatExcludedWithDiscount si dispo, sinon AmountVatExcluded)
    const totalHt =
      ebpLine.NetAmountVatExcludedWithDiscount !== undefined &&
      ebpLine.NetAmountVatExcludedWithDiscount !== null
        ? Number(ebpLine.NetAmountVatExcludedWithDiscount)
        : Number(ebpLine.AmountVatExcluded) || 0;

    // Calcul du montant de remise
    let discountAmount = 0;
    if (
      ebpLine.AmountVatExcluded !== undefined &&
      ebpLine.NetAmountVatExcludedWithDiscount !== undefined &&
      ebpLine.AmountVatExcluded !== null &&
      ebpLine.NetAmountVatExcludedWithDiscount !== null &&
      Number(ebpLine.AmountVatExcluded) > 0 &&
      Number(ebpLine.NetAmountVatExcludedWithDiscount) > 0
    ) {
      discountAmount =
        Number(ebpLine.AmountVatExcluded) -
        Number(ebpLine.NetAmountVatExcludedWithDiscount);
    }

    // Calcul du pourcentage de remise
    let discountPercent = 0;
    if (quantity > 0 && unitPrice > 0 && discountAmount > 0) {
      discountPercent = (discountAmount / (quantity * unitPrice)) * 100;
    }

    const taxRate = 20; // Par défaut, à ajuster si besoin

    return {
      document_id: appDocumentId,
      material_id: materialId,
      description:
        ebpLine.DescriptionClear ||
        ebpLine.TechnicalDescriptionClear ||
        'Aucune description',
      quantity: quantity,
      unit: 'unité',
      unit_price: unitPrice,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      tax_rate: taxRate,
      total_ht: totalHt,
      sort_order: ebpLine.LineOrder ?? 0,
      ebp_line_id: ebpLine.Id,
    };
  }

  /**
   * Insère ou met à jour une ligne de document dans la base de l'application
   */
  async upsertDocumentLine(
    lineData: AppDocumentLine,
    client: PoolClient,
  ): Promise<number | null> {
    this.logger.debug(
      `Tentative d'upsert de la ligne de document EBP ID: ${lineData.ebp_line_id} pour document APP ID: ${lineData.document_id}`,
    );
    try {
      // Check if the line exists based on the EBP line ID and parent document ID
      // Assuming 'ebp_line_id' column exists in 'document_lines' for tracking
      const selectQuery = `SELECT id FROM document_lines WHERE "ebp_line_id" = $1 AND document_id = $2`;
      const selectResult = await client.query<{ id: number }>(selectQuery, [
        lineData.ebp_line_id,
        lineData.document_id,
      ]);

      if (selectResult.rows.length > 0) {
        const existingId = selectResult.rows[0].id;
        this.logger.debug(
          `Ligne de document existante trouvée (ID App: ${existingId}), mise à jour...`,
        );

        const updateQuery = `
          UPDATE document_lines
          SET
            material_id = $1,
            description = $2,
            quantity = $3,
            unit = $4,
            unit_price = $5,
            discount_percent = $6,
            discount_amount = $7,
            tax_rate = $8,
            total_ht = $9,
            sort_order = $10,
            updated_at = NOW()
          WHERE id = $11
          RETURNING id
        `;
        const updateValues = [
          lineData.material_id,
          lineData.description,
          lineData.quantity,
          lineData.unit,
          lineData.unit_price,
          lineData.discount_percent,
          lineData.discount_amount,
          lineData.tax_rate,
          lineData.total_ht,
          lineData.sort_order,
          existingId,
        ];

        const updateResult = await client.query<{ id: number }>(
          updateQuery,
          updateValues,
        );

        if (updateResult.rows.length > 0) {
          this.logger.debug(
            `Ligne de document mise à jour avec succès (ID App: ${updateResult.rows[0].id})`,
          );
          return updateResult.rows[0].id;
        } else {
          this.logger.error(
            `Échec de la mise à jour de la ligne de document (ID App: ${existingId}). Aucun ID retourné.`,
          );
          return null;
        }
      } else {
        this.logger.debug('Ligne de document non trouvée, insertion...');
        // The line does not exist, insert it
        const insertQuery = `
          INSERT INTO document_lines (
            document_id, material_id, description, quantity, unit, unit_price,
            discount_percent, discount_amount, tax_rate, total_ht, sort_order,
            ebp_line_id, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
          )
          RETURNING id
        `;
        const insertValues = [
          lineData.document_id,
          lineData.material_id,
          lineData.description,
          lineData.quantity,
          lineData.unit,
          lineData.unit_price,
          lineData.discount_percent,
          lineData.discount_amount,
          lineData.tax_rate,
          lineData.total_ht,
          lineData.sort_order,
          lineData.ebp_line_id,
        ];

        const insertResult = await client.query<{ id: number }>(
          insertQuery,
          insertValues,
        );

        if (insertResult.rows.length > 0) {
          this.logger.debug(
            `Ligne de document insérée avec succès (ID App: ${insertResult.rows[0].id})`,
          );
          return insertResult.rows[0].id;
        } else {
          this.logger.error(
            `Échec de l'insertion de la ligne de document EBP ID: ${lineData.ebp_line_id}. Aucun ID retourné.`,
          );
          return null;
        }
      }
    } catch (error) {
      const typedError = error as DatabaseError;
      this.logger.error(
        `Erreur BDD lors de l'upsert de la ligne de document EBP ID ${lineData.ebp_line_id} pour document APP ID ${lineData.document_id}: ${typedError.message}`,
        `Code: ${typedError.code}, Table: ${typedError.table}, Colonne: ${typedError.column}, Contrainte: ${typedError.constraint}`,
        typedError.stack,
      );
      return null;
    }
  }

  /**
   * Synchronise tous les documents
   */
  async syncAllConstructionSiteDocuments(): Promise<{
    success: boolean;
    count: number;
    total: number;
    errors: { identifier: string; error: string }[];
  }> {
    this.logger.log(
      'Démarrage de la synchronisation des documents de chantier...',
    );
    const errors: { identifier: string; error: string }[] = [];
    let syncedCount = 0;
    // Déclaration des variables en dehors du try pour la portée
    let ebpDocs: ConstructionsitereferencedocumentInterface[] = [];
    let ebpDocsEx: ConstructionsitereferencedocumentexInterface[] = [];
    let ebpSaleLines: DealsaledocumentlineInterface[] = [];
    let ebpPurchaseLines: DealpurchasedocumentlineInterface[] = [];
    let allEbpLines: (
      | DealsaledocumentlineInterface
      | DealpurchasedocumentlineInterface
    )[] = [];
    let client: PoolClient | null = null;
    try {
      ebpDocs = await this.getAllDocumentsFromEBP();
      ebpDocsEx = await this.getAllDocumentsExFromEBP();
      ebpSaleLines = await this.getAllSaleDocumentLinesFromEBP();
      ebpPurchaseLines = await this.getAllPurchaseDocumentLinesFromEBP();
      allEbpLines = [...ebpSaleLines, ...ebpPurchaseLines];
      this.logger.log(
        `Récupérés ${ebpDocs.length} documents de référence EBP.`,
      );
      this.logger.log(
        `Récupérées ${allEbpLines.length} lignes de document depuis EBP.`,
      );

      client = await PgClient2.getClient();

      for (const ebpDoc of ebpDocs) {
        const documentIdentifier =
          ebpDoc.DocumentNumber || ebpDoc.Id || 'ID_INCONNU';
        try {
          const ebpDocEx = ebpDocsEx.find((ex) => ex.Id === ebpDoc.Id);
          const appDoc = await this.convertToAppDocument(ebpDoc, ebpDocEx);

          if (!appDoc) {
            this.logger.warn(
              `Skipping document ${documentIdentifier} - conversion failed.`,
            );
            errors.push({
              identifier: documentIdentifier,
              error: "Conversion de l'en-tête échouée",
            });
            continue;
          }

          if (!appDoc.project_id) {
            this.logger.warn(
              `Skipping document ${documentIdentifier} - project_id is missing after conversion.`,
            );
            errors.push({
              identifier: documentIdentifier,
              error: 'project_id manquant après conversion',
            });
            continue;
          }

          this.logger.debug(
            `[DEBUG] Upsert document: ref=${appDoc.reference}, project_id=${appDoc.project_id}`
          );

          const documentIdApp = await this.upsertDocument(appDoc, client);

          if (documentIdApp) {
            syncedCount++;
            this.logger.debug(
              `Synchronisé document EBP ${ebpDoc.Id} vers APP ${documentIdApp}`,
            );

            const relatedEbpLines = allEbpLines.filter(
              (
                line:
                  | DealsaledocumentlineInterface
                  | DealpurchasedocumentlineInterface,
              ) =>
                line &&
                typeof line === 'object' &&
                'DocumentId' in line &&
                line.DocumentId === ebpDoc.Id,
            );
            this.logger.debug(
              `Found ${relatedEbpLines.length} lines for document EBP ID ${ebpDoc.Id}`,
            );

            for (const ebpLine of relatedEbpLines) {
              try {
                const appDocumentLine =
                  await this.mapEbpDocumentLineToAppDocumentLine(
                    ebpLine,
                    documentIdApp,
                  );

                if (appDocumentLine) {
                  const documentLineId = await this.upsertDocumentLine(
                    appDocumentLine,
                    client,
                  );
                  if (!documentLineId) {
                    errors.push({
                      identifier: `Ligne ${'Id' in ebpLine ? ebpLine.Id : 'INCONNU'} pour document ${documentIdentifier}`,
                      error: "Échec de l'insertion/màj de la ligne",
                    });
                  } else {
                    this.logger.debug(
                      `Ligne EBP ${'Id' in ebpLine ? ebpLine.Id : 'INCONNU'} synchronisée avec succès (ID App: ${documentLineId})`,
                    );
                  }
                } else {
                  errors.push({
                    identifier: `Ligne ${'Id' in ebpLine ? ebpLine.Id : 'INCONNU'} pour document ${documentIdentifier}`,
                    error: 'Échec du mappage de la ligne',
                  });
                }
              } catch (lineError) {
                const errMsg =
                  lineError instanceof Error
                    ? lineError.message
                    : String(lineError);
                this.logger.error(
                  `Erreur lors de la synchronisation de la ligne EBP ${'Id' in ebpLine ? ebpLine.Id : 'INCONNU'} pour document ${documentIdentifier}: ${errMsg}`,
                  `Erreur lors de la synchronisation de la ligne EBP ${ebpLine.Id} pour document ${documentIdentifier}: ${errMsg}`,
                  lineError instanceof Error ? lineError.stack : undefined,
                );
                errors.push({
                  identifier: `Ligne ${ebpLine.Id} pour document ${documentIdentifier}`,
                  error: `Erreur lors du traitement de la ligne: ${errMsg}`,
                });
              }
            }

            if (syncedCount % 50 === 0 || syncedCount === ebpDocs.length) {
              this.logger.log(
                `Progression: ${syncedCount}/${ebpDocs.length} documents traités`,
              );
            }
          } else {
            errors.push({
              identifier: documentIdentifier,
              error: `Échec de l'insertion/màj de l'en-tête pour le document ${documentIdentifier}`,
            });
          }
        } catch (docError) {
          const errorMessage =
            docError instanceof Error ? docError.message : String(docError);
          this.logger.error(
            `Erreur majeure lors de la synchronisation du document ${documentIdentifier}: ${errorMessage}`,
            docError instanceof Error ? docError.stack : undefined,
          );
          errors.push({
            identifier: documentIdentifier,
            error: `Erreur majeure lors du traitement du document: ${errorMessage}`,
          });
        }
      }

      if (client && typeof client.release === 'function') {
        client.release();
      }

      this.logger.log(
        `Synchronisation des documents terminée. ${syncedCount}/${ebpDocs.length} documents traités avec succès (en-têtes). ${errors.length} erreurs rencontrées lors du traitement des documents ou de leurs lignes.`,
      );
      return {
        success: errors.length === 0,
        count: syncedCount,
        total: ebpDocs.length,
        errors,
      };
    } catch (globalError) {
      const errorMessage =
        globalError instanceof Error
          ? globalError.message
          : String(globalError);
      this.logger.error(
        `Erreur globale lors de la synchronisation des documents ou de leurs lignes: ${errorMessage}`,
        globalError instanceof Error ? globalError.stack : undefined,
      );
      errors.push({ identifier: 'GLOBAL', error: errorMessage });
      return {
        success: false,
        count: syncedCount,
        total: ebpDocs.length,
        errors: errors,
      };
    }
  }

  private async upsertDocument(
    documentData: Partial<Document>,
    client: PoolClient,
  ): Promise<number | null> {
    this.logger.debug(
      `[DEBUG] Upsert document: ref=${documentData.reference}, project_id=${documentData.project_id}`
    );
    const selectQuery = `SELECT id FROM documents WHERE reference = $1`;
    const selectResult = await client.query<{ id: number }>(selectQuery, [
      documentData.reference,
    ]);

    const appId = selectResult.rows[0]
      ? Number((selectResult.rows[0] as { id: number }).id)
      : undefined;
    if (appId) {
      const updateQuery = `UPDATE documents SET
              project_id = $1,
              type = $2,
              reference = $3,
              status = $4,
              amount = $5,
              issue_date = $6,
              due_date = $7,
              payment_date = $8,
              payment_method = $9,
              payment_terms = $10,
              discount_rate = $11,
              discount_amount = $12,
              payment_status = $13,
              amount_paid = $14,
              balance_due = $15,
              legal_mentions = $16,
              validity_period = $17,
              signed_by_client = $18,
              signed_date = $19,
              approved_by_staff_id = $20,
              electronic_signature_path = $21,
              version = $22,
              parent_document_id = $23,
              revision_reason = $24,
              quotation_id = $25,
              purchase_order_reference = $26,
              delivery_address_id = $27,
              delivery_date = $28,
              shipping_costs = $29,
              notes = $30,
              file_path = $31,
              updated_at = NOW()
              WHERE id = $32
           `;
      const updateValues = [
        documentData.project_id,
        documentData.type,
        documentData.reference,
        documentData.status,
        documentData.amount,
        documentData.issue_date,
        documentData.due_date,
        documentData.payment_date,
        documentData.payment_method,
        documentData.payment_terms,
        documentData.discount_rate,
        documentData.discount_amount,
        documentData.payment_status,
        documentData.amount_paid,
        documentData.balance_due,
        documentData.legal_mentions,
        documentData.validity_period,
        documentData.signed_by_client,
        documentData.signed_date,
        documentData.approved_by_staff_id,
        documentData.electronic_signature_path,
        documentData.version,
        documentData.parent_document_id,
        documentData.revision_reason,
        documentData.quotation_id,
        documentData.purchase_order_reference,
        documentData.delivery_address_id,
        documentData.delivery_date,
        documentData.shipping_costs,
        documentData.notes,
        documentData.file_path,
        appId,
      ];
      await client.query(updateQuery, updateValues);
      return appId;
    } else {
      const insertQuery = `INSERT INTO documents (
              "documentId", project_id, type, reference, status, amount, issue_date, due_date, payment_date,
              payment_method, payment_terms, discount_rate, discount_amount, payment_status, amount_paid,
              balance_due, legal_mentions, validity_period, signed_by_client, signed_date, approved_by_staff_id,
              electronic_signature_path, version, parent_document_id, revision_reason, quotation_id,
              purchase_order_reference, delivery_address_id, delivery_date, shipping_costs, notes, file_path, created_at, updated_at
          ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
              $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, NOW(), NOW()
          ) RETURNING id`;

      const insertValues = [
        documentData.documentId,
        documentData.project_id,
        documentData.type,
        documentData.reference,
        documentData.status,
        documentData.amount,
        documentData.issue_date,
        documentData.due_date,
        documentData.payment_date,
        documentData.payment_method,
        documentData.payment_terms,
        documentData.discount_rate,
        documentData.discount_amount,
        documentData.payment_status,
        documentData.amount_paid,
        documentData.balance_due,
        documentData.legal_mentions,
        documentData.validity_period,
        documentData.signed_by_client,
        documentData.signed_date,
        documentData.approved_by_staff_id,
        documentData.electronic_signature_path,
        documentData.version,
        documentData.parent_document_id,
        documentData.revision_reason,
        documentData.quotation_id,
        documentData.purchase_order_reference,
        documentData.delivery_address_id,
        documentData.delivery_date,
        documentData.shipping_costs,
        documentData.notes,
        documentData.file_path,
      ];

      const insertResult = await client.query(insertQuery, insertValues);
      const insertedId = insertResult.rows[0]
        ? Number((insertResult.rows[0] as { id: number }).id)
        : undefined;
      return insertedId ?? null;
    }
  }
}
