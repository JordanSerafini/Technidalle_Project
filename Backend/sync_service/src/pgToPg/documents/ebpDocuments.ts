import { Logger } from '@nestjs/common';
import { PoolClient, DatabaseError } from 'pg';
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
import { QueryService } from '../../services/query.service';
import { ClientSyncService } from '../../services/client-sync.service';

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
      destinationClient = await pgClientDestination.getClient();
      if (!destinationClient) {
        this.logger.error(
          "Impossible d'obtenir un client de la pool de destination.",
        );
        return null;
      }

      // Vérifier si ConstructionSiteId existe
      if (!ebpDoc.ConstructionSiteId) {
        this.logger.warn(
          `Skipping document ${ebpDoc.DocumentNumber}: ConstructionSiteId is missing.`,
        );
        return null;
      }

      this.logger.debug(
        `[Doc ${ebpDoc.DocumentNumber}] Looking up project with EBP ID: ${ebpDoc.ConstructionSiteId}`,
      );
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
      destinationClient = await pgClientDestination.getClient();
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
            if (true) {
              // Remplacez 'true' par une validation si nécessaire
              // Assumant que les autres clés correspondent (ex: `reference` -> `"reference"`)
              // Si besoin de mapper `someCamelCase` vers `"some_snake_case"`, il faudrait le faire ici.
              updateFields.push(`"${key}" = $${paramIndex}`); // Utilise la clé telle quelle (devrait correspondre aux colonnes SQL sauf pour documentId)
              updateValues.push(documentData[typedKey]);
              paramIndex++;
            }
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
    let total = 0;
    let count = 0;
    const errors: { identifier: string; error: string }[] = [];

    try {
      ebpDocs = await this.getAllDocumentsFromEBP();
      ebpDocsEx = await this.getAllDocumentsExFromEBP();
      total = ebpDocs.length;

      this.logger.log(`Début de la synchronisation de ${total} documents`);

      for (const ebpDoc of ebpDocs) {
        const identifier = ebpDoc.DocumentNumber || ebpDoc.Id || 'ID_INCONNU'; // Utiliser un identifiant pertinent
        try {
          const ebpDocEx = ebpDocsEx.find((ex) => ex.Id === ebpDoc.Id);
          const appDoc = await this.convertToAppDocument(ebpDoc, ebpDocEx);

          if (appDoc) {
            const insertedId = await this.insertDocumentIntoApp(appDoc);
            if (insertedId) {
              count++;
              if (count % 50 === 0 || count === total) {
                // Log tous les 50 ou à la fin
                this.logger.log(
                  `Progression: ${count}/${total} documents traités`,
                );
              }
            } else {
              // Erreur loggée dans insertDocumentIntoApp
              errors.push({
                identifier,
                error: `Échec de l'insertion/màj pour le document ${identifier}`,
              });
            }
          } else {
            // Erreur loggée dans convertToAppDocument
            errors.push({
              identifier,
              error: `Échec de la conversion pour le document ${identifier}`,
            });
          }
        } catch (docError) {
          // Capturer les erreurs inattendues au niveau de la boucle
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
      // Erreur lors de la récupération initiale des documents
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
    this.logger.debug(`getProjectByEbpId called with EBP ID: ${ebpId}`);
    try {
      this.logger.debug(`Recherche du projet avec l'ID EBP ${ebpId}`);
      const result = await destinationClient.query<{ id: number }>(
        'SELECT id FROM projects WHERE "project_id" = $1',
        [ebpId],
      );

      if (result.rows.length > 0 && result.rows[0].id) {
        this.logger.debug(
          `getProjectByEbpId: Found project App ID ${result.rows[0].id} for EBP ID ${ebpId}`,
        );
        return result.rows[0];
      } else {
        this.logger.warn(`Aucun projet trouvé avec l'ID EBP ${ebpId}`);
        return null;
      }
    } catch (error) {
      const typedError = error as DatabaseError;
      this.logger.error(
        `Erreur lors de la récupération du projet avec EBP ID ${ebpId}: ${typedError.message}`,
        `Code: ${typedError.code}`,
        typedError.stack,
      );
      return null;
    }
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
}
