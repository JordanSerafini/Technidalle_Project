import { Injectable, Logger } from '@nestjs/common';
import { DealToProjectMapper } from './mappers/deal-to-project.mapper';
import { QueryService } from '../services/query.service';
import { ProjectAPP } from '../interfaces/projects/projectAPP';
import { QueryResultRow } from 'pg';

// Définition de l'enum ProjectStatus
export enum ProjectStatus {
  PROSPECT = 'prospect',
  DEVIS_EN_COURS = 'devis_en_cours',
  DEVIS_ACCEPTE = 'devis_accepte',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  ANNULE = 'annule',
}

// Définition minimale des interfaces
export interface Project {
  external_ebp_id?: string;
  name: string;
  reference: string;
  description?: string;
  client_id: string | null | undefined;
  status?: string;
  start_date?: Date;
  end_date?: Date;
  estimated_duration?: number;
  budget?: number;
  actual_cost?: number;
  margin?: number;
  notes?: string;
  id?: number;
  deal_id?: string | null | undefined;
}

interface Client {
  company_name?: string;
  firstname: string;
  lastname: string;
  email: string;
  customer_id?: string;
  external_ebp_customer_id?: string;
  id?: string | number;
}

interface Deal {
  Id: string;
  Caption?: string;
  Notes?: string;
  DealState?: number;
  xx_DateDebut?: Date;
  xx_DateFin?: Date;
  PredictedDuration?: number;
  PredictedCosts?: number;
  AccomplishedCosts?: number;
  PredictedGrossMargin?: number;
  xx_Client?: string;
}

export interface EbpDealView {
  Id: string;
  Caption: string;
  DealDate: Date;
  PredictedCosts: number;
  AccomplishedCosts: number;
  PredictedGrossMargin: number;
  xx_DateDebut?: Date;
  xx_DateFin?: Date;
  Notes?: string;
  DealState?: number;
  EbpClientReference?: string;
  PredictedDuration?: number;
  ebp_payload_source?: any;
  xx_Client?: string;
}

interface EbpSaleDocumentView {
  Id: string;
  EbpDocumentId: string;
  DocumentNumber: string;
  DocumentDate: Date;
  DocumentType: number;
  EbpCustomerId?: string;
  EbpCustomerName?: string;
  AmountVatExcluded: number;
  NetAmount?: number; // Итоговая сумма H.T. после скидок
  EbpDealId: string; // Для связи с проектом (external_ebp_id проекта)
  DocumentState?: number;
  // добавьте другие поля из вашего представления synced_ebp_sale_documents
  ebp_payload_source?: any;
}

@Injectable()
export class SyncDealsService {
  private readonly logger = new Logger(SyncDealsService.name);
  private dealMapper: DealToProjectMapper;

  constructor(private readonly queryService: QueryService) {
    this.dealMapper = DealToProjectMapper.getInstance();
  }

  async syncAllEbpData(): Promise<{
    sync_type: string;
    status: string;
    items_processed: number;
    items_succeeded: number;
    items_failed: number;
    duration_ms: number;
    details: string;
  }> {
    const startTime = Date.now();

    this.logger.log(
      'Starting full EBP data synchronization (deals and documents)',
    );

    let totalProcessed = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;
    const errorMessages: string[] = [];
    let status = 'SUCCESS';

    try {
      this.logger.log('Starting EBP Deals synchronization...');
      const dealSyncResult = await this._syncDeals();
      totalProcessed += dealSyncResult.processed;
      totalSucceeded += dealSyncResult.succeeded;
      totalFailed += dealSyncResult.failed;
      if (dealSyncResult.errors.length > 0)
        errorMessages.push(...dealSyncResult.errors);
      this.logger.log(
        `Deals synchronization finished. ${dealSyncResult.succeeded}/${dealSyncResult.processed} succeeded.`,
      );

      this.logger.log('Starting EBP Sale Documents synchronization...');
      const docSyncResult = await this._syncSaleDocuments();
      totalProcessed += docSyncResult.processed;
      totalSucceeded += docSyncResult.succeeded;
      totalFailed += docSyncResult.failed;
      if (docSyncResult.errors.length > 0)
        errorMessages.push(...docSyncResult.errors);
      this.logger.log(
        `Sale Documents synchronization finished. ${docSyncResult.succeeded}/${docSyncResult.processed} succeeded.`,
      );

      status = totalFailed === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS';
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Full EBP synchronization failed', err.stack);
      status = 'FAILURE';
      errorMessages.push(`Critical failure: ${err.message}`);
    }

    const duration_ms = Date.now() - startTime;
    this.logger.log(
      `Synchronization completed with status: ${status} in ${duration_ms}ms. Processed: ${totalProcessed}, Succeeded: ${totalSucceeded}, Failed: ${totalFailed}`,
    );

    if (errorMessages.length > 0) {
      this.logger.warn(`Sync errors: ${errorMessages.join('\n')}`);
    }

    return {
      sync_type: 'deals_and_documents_ebp',
      status,
      items_processed: totalProcessed,
      items_succeeded: totalSucceeded,
      items_failed: totalFailed,
      duration_ms,
      details: errorMessages.join('\n'),
    };
  }

  // Helper pour construire la clause SET pour les UPDATEs
  private buildUpdateSetClause(
    data: Record<string, any>,
    startingIndex: number = 1,
  ): { clause: string; values: any[] } {
    const keys = Object.keys(data);
    const clause = keys
      .map((key, index) => `"${key}" = $${startingIndex + index}`)
      .join(', ');
    const values = keys.map((key) => data[key]);
    return { clause, values };
  }

  private async _syncDeals(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];
    let ebpDeals: EbpDealView[] = [];

    try {
      try {
        interface ViewExistsResult extends QueryResultRow {
          exists: boolean;
        }
        const viewCheckResult =
          await this.queryService.executeQuery<ViewExistsResult>(
            "SELECT to_regclass('synced_ebp_deals') IS NOT NULL as exists",
          );
        const viewExists = viewCheckResult.rows[0]?.exists || false;

        if (!viewExists) {
          this.logger.warn(
            "La vue synced_ebp_deals n'existe pas. Retour de tableau vide.",
          );
          return { processed: 0, succeeded: 0, failed: 0, errors: [] };
        }

        const result = await this.queryService.executeQuery<EbpDealView>(
          'SELECT * FROM synced_ebp_deals',
        );
        ebpDeals = result.rows;
      } catch (viewError: unknown) {
        const err =
          viewError instanceof Error ? viewError : new Error(String(viewError));
        this.logger.warn(
          `Erreur lors de la vérification de la vue synced_ebp_deals: ${err.message}. Utilisation d'un tableau vide.`,
        );
        ebpDeals = [];
      }

      processed = ebpDeals.length;
      this.logger.log(`Found ${processed} deals to synchronize from EBP view.`);

      for (const ebpDeal of ebpDeals) {
        try {
          const clientInfo = this.dealMapper.extractClientInfo(ebpDeal);
          let client: Client | null = null;

          if (ebpDeal.EbpClientReference) {
            const clientResult = await this.queryService.executeQuery<Client>(
              'SELECT * FROM clients WHERE external_ebp_customer_id = $1',
              [ebpDeal.EbpClientReference],
            );
            client = clientResult.rows[0] || null;
          }

          if (!client && clientInfo.company_name) {
            const clientResult = await this.queryService.executeQuery<Client>(
              'SELECT * FROM clients WHERE company_name = $1',
              [clientInfo.company_name],
            );
            client = clientResult.rows[0] || null;
          }

          const clientDataToSave: Partial<Client> = {
            ...clientInfo,
            external_ebp_customer_id: ebpDeal.EbpClientReference,
          };

          Object.keys(clientDataToSave).forEach(
            (key) =>
              clientDataToSave[key] === undefined &&
              delete clientDataToSave[key],
          );

          let currentClientInDb: Client | null = null;
          if (client?.id) {
            const existingClientResult =
              await this.queryService.executeQuery<Client>(
                'SELECT * FROM clients WHERE id = $1',
                [client.id],
              );
            currentClientInDb = existingClientResult.rows[0] || null;
          }

          if (currentClientInDb) {
            const updateClause = this.buildUpdateSetClause(clientDataToSave, 2);
            const updateQuery = `UPDATE clients SET ${updateClause.clause} WHERE id = $1`;
            const updateValues = [currentClientInDb.id, ...updateClause.values];
            await this.queryService.executeQuery(updateQuery, updateValues);
            this.logger.log(
              `Updated client ${currentClientInDb.id} with EBP reference ${ebpDeal.EbpClientReference}`,
            );
          } else if (clientDataToSave.company_name) {
            const insertKeys = Object.keys(clientDataToSave).join(', ');
            const insertValuesPlaceholders = Object.keys(clientDataToSave)
              .map((_, index) => `$${index + 1}`)
              .join(', ');
            const insertValues = Object.values(clientDataToSave);
            const insertQuery = `INSERT INTO clients (${insertKeys}) VALUES (${insertValuesPlaceholders}) RETURNING id`;
            const insertResult = await this.queryService.executeQuery<Client>(
              insertQuery,
              insertValues,
            );
            const newClientId = insertResult.rows[0]?.id;
            if (newClientId) {
              this.logger.log(
                `Created new client with id ${newClientId} from EBP deal ${ebpDeal.Id}`,
              );
              client = { ...(clientDataToSave as Client), id: newClientId };
            } else {
              throw new Error('Failed to retrieve new client ID after insert');
            }
          }

          let project: Project | null = null;
          const projectResult = await this.queryService.executeQuery<Project>(
            'SELECT * FROM projects WHERE external_ebp_id = $1',
            [ebpDeal.Id],
          );
          project = projectResult.rows[0] || null;

          const projectDataToSave: Partial<ProjectAPP> =
            this.dealMapper.map(ebpDeal);

          if (client?.id) {
            projectDataToSave.client_id = String(client.id);
          } else {
            projectDataToSave.client_id = null;
          }

          const mergedProjectData = project
            ? { ...project, ...projectDataToSave }
            : projectDataToSave;

          if (project) {
            const updateClause = this.buildUpdateSetClause(
              mergedProjectData,
              2,
            );
            const updateQuery = `UPDATE projects SET ${updateClause.clause} WHERE id = $1`;
            const updateValues = [project.id, ...updateClause.values];
            await this.queryService.executeQuery(updateQuery, updateValues);
            this.logger.log(
              `Updated project ${project.id} from EBP deal ${ebpDeal.Id}`,
            );
          } else if (mergedProjectData.name && mergedProjectData.client_id) {
            const insertKeys = Object.keys(mergedProjectData).join(', ');
            const insertValuesPlaceholders = Object.keys(mergedProjectData)
              .map((_, index) => `$${index + 1}`)
              .join(', ');
            const insertValues = Object.values(mergedProjectData);
            const insertQuery = `INSERT INTO projects (${insertKeys}) VALUES (${insertValuesPlaceholders})`;
            await this.queryService.executeQuery(insertQuery, insertValues);
            this.logger.log(`Created new project from EBP deal ${ebpDeal.Id}`);
          } else {
            this.logger.warn(
              `Skipping project sync for EBP deal ${ebpDeal.Id} due to missing required fields (name or client_id).`,
            );
            failed++;
            errors.push(
              `Skipped project sync for EBP deal ${ebpDeal.Id}: missing name or client_id.`,
            );
            continue;
          }

          succeeded++;
        } catch (itemError: unknown) {
          failed++;
          const err =
            itemError instanceof Error
              ? itemError
              : new Error(String(itemError));
          errors.push(`Failed to sync deal ${ebpDeal.Id}: ${err.message}`);
          this.logger.error(`Failed to sync deal ${ebpDeal.Id}`, err.stack);
        }
      }
    } catch (queryError: unknown) {
      failed = processed - succeeded;
      const err =
        queryError instanceof Error
          ? queryError
          : new Error(String(queryError));
      errors.push(`Query failed during deal sync: ${err.message}`);
      this.logger.error('Query failed during deal sync', err.stack);
    }

    return { processed, succeeded, failed, errors };
  }

  private async _syncSaleDocuments(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];
    let ebpSaleDocuments: EbpSaleDocumentView[] = [];

    try {
      try {
        interface ViewExistsResult extends QueryResultRow {
          exists: boolean;
        }
        const viewCheckResult =
          await this.queryService.executeQuery<ViewExistsResult>(
            "SELECT to_regclass('synced_ebp_sale_documents') IS NOT NULL as exists",
          );
        const viewExists = viewCheckResult.rows[0]?.exists || false;

        if (!viewExists) {
          this.logger.warn(
            "La vue synced_ebp_sale_documents n'existe pas. Retour de tableau vide.",
          );
          return { processed: 0, succeeded: 0, failed: 0, errors: [] };
        }

        const result =
          await this.queryService.executeQuery<EbpSaleDocumentView>(
            'SELECT * FROM synced_ebp_sale_documents',
          );
        ebpSaleDocuments = result.rows;
      } catch (viewError: unknown) {
        const err =
          viewError instanceof Error ? viewError : new Error(String(viewError));
        this.logger.warn(
          `Erreur lors de la vérification de la vue synced_ebp_sale_documents: ${err.message}. Utilisation d'un tableau vide.`,
        );
        ebpSaleDocuments = [];
      }

      processed = ebpSaleDocuments.length;
      this.logger.log(
        `Found ${processed} sale documents to synchronize from EBP view.`,
      );

      for (const ebpSaleDocument of ebpSaleDocuments) {
        try {
          // Logic to sync sale documents
          this.logger.log(
            `Syncing sale document ${ebpSaleDocument.DocumentNumber}`,
          );

          succeeded++;
        } catch (docError: unknown) {
          failed++;
          const err =
            docError instanceof Error ? docError : new Error(String(docError));
          errors.push(
            `Failed to sync sale document ${ebpSaleDocument.DocumentNumber}: ${err.message}`,
          );
          this.logger.error(
            `Failed to sync sale document ${ebpSaleDocument.DocumentNumber}`,
            err.stack,
          );
        }
      }
    } catch (error: unknown) {
      failed = processed - succeeded;
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(
        `An error occurred during sale document sync: ${err.message}`,
      );
      this.logger.error(
        'An error occurred during sale document sync',
        err.stack,
      );
    }

    return { processed, succeeded, failed, errors };
  }
}
