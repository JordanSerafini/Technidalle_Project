import { Injectable, Logger } from '@nestjs/common';
import { DealToProjectMapper } from './mappers/deal-to-project.mapper';
import { QueryService } from '../services/query.service';

interface EbpDealView {
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

// Définir les interfaces directement ici
interface Project {
  id?: number;
  client_id?: string | null;
  external_ebp_id?: string;
  name?: string;
  reference?: string;
  status?: string;
  [key: string]: any;
}

interface Client {
  id?: number;
  external_ebp_customer_id?: string;
  company_name?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  [key: string]: any;
}

@Injectable()
export class SyncDealsService {
  private readonly logger = new Logger(SyncDealsService.name);
  private dealMapper: DealToProjectMapper;

  constructor(private readonly queryService: QueryService) {
    this.dealMapper = DealToProjectMapper.getInstance();
  }

  async syncAllEbpData(): Promise<any> {
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
    } catch (error) {
      this.logger.error('Full EBP synchronization failed', error.stack);
      status = 'FAILURE';
      errorMessages.push(`Critical failure: ${error.message}`);
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
      // Vérifier si la vue existe avant de l'interroger
      try {
        const viewCheckResult = await this.queryService.executeQuery(
          "SELECT to_regclass('synced_ebp_deals') IS NOT NULL as exists",
        );
        const viewExists = viewCheckResult.rows[0]?.exists || false;

        if (!viewExists) {
          this.logger.warn(
            "La vue synced_ebp_deals n'existe pas. Retour de tableau vide.",
          );
          return { processed: 0, succeeded: 0, failed: 0, errors: [] };
        }

        // La vue existe, on peut continuer
        const result = await this.queryService.executeQuery(
          'SELECT * FROM synced_ebp_deals',
        );
        ebpDeals = result.rows as EbpDealView[];
      } catch (viewError) {
        this.logger.warn(
          `Erreur lors de la vérification de la vue synced_ebp_deals: ${viewError.message}. Utilisation d'un tableau vide.`,
        );
        ebpDeals = []; // Utiliser un tableau vide
      }

      processed = ebpDeals.length;
      this.logger.log(`Found ${processed} deals to synchronize from EBP view.`);

      for (const ebpDeal of ebpDeals) {
        try {
          // Utiliser la méthode extractClientInfo du mapper
          const clientInfo = this.dealMapper.extractClientInfo(ebpDeal);
          let client: Client | null = null;

          if (ebpDeal.EbpClientReference) {
            const clientResult = await this.queryService.executeQuery(
              'SELECT * FROM clients WHERE external_ebp_customer_id = $1',
              [ebpDeal.EbpClientReference],
            );
            client = clientResult.rows[0] || null;
          }

          if (!client && clientInfo.company_name) {
            const clientResult = await this.queryService.executeQuery(
              'SELECT * FROM clients WHERE company_name = $1',
              [clientInfo.company_name],
            );
            client = clientResult.rows[0] || null;
          }

          const clientDataToSave = {
            ...clientInfo,
            external_ebp_customer_id: ebpDeal.EbpClientReference,
          };

          // Supprimer les clés undefined pour éviter les erreurs SQL
          Object.keys(clientDataToSave).forEach(
            (key) =>
              clientDataToSave[key] === undefined &&
              delete clientDataToSave[key],
          );

          if (!client) {
            const insertClientQuery = `INSERT INTO clients (${Object.keys(
              clientDataToSave,
            )
              .map((k) => `"${k}"`)
              .join(', ')}) VALUES (${Object.keys(clientDataToSave)
              .map((_, i) => `$${i + 1}`)
              .join(', ')}) RETURNING *`;
            const insertResult = await this.queryService.executeQuery(
              insertClientQuery,
              Object.values(clientDataToSave),
            );
            client = insertResult.rows[0];
          } else {
            // Mise à jour du client existant si nécessaire
            if (
              client &&
              ebpDeal.EbpClientReference &&
              !client.external_ebp_customer_id
            ) {
              const { clause, values } = this.buildUpdateSetClause(
                { external_ebp_customer_id: ebpDeal.EbpClientReference },
                1,
              );
              await this.queryService.executeQuery(
                `UPDATE clients SET ${clause} WHERE id = $${values.length + 1}`,
                [...values, client.id],
              );
              client.external_ebp_customer_id = ebpDeal.EbpClientReference;
            }
          }

          if (!client || !client.id)
            throw new Error('Failed to create or retrieve client');

          // Vérifier si le projet existe déjà
          const projectResult = await this.queryService.executeQuery(
            'SELECT * FROM projects WHERE external_ebp_id = $1',
            [ebpDeal.Id],
          );
          let project: Project | null = projectResult.rows[0] || null;

          // Utiliser le mapper pour convertir les données
          const projectData = this.dealMapper.map(
            ebpDeal,
            client.id,
            project || undefined,
          );

          Object.keys(projectData).forEach(
            (key) => projectData[key] === undefined && delete projectData[key],
          );

          if (!project) {
            const { clause: insertProjectFields, values: insertProjectValues } =
              this.buildUpdateSetClause(projectData, 1);
            const insertProjectQuery = `INSERT INTO projects (${Object.keys(
              projectData,
            )
              .map((k) => `"${k}"`)
              .join(', ')}) VALUES (${Object.keys(projectData)
              .map((_, i) => `$${i + 1}`)
              .join(', ')}) RETURNING *`;
            const insertResult = await this.queryService.executeQuery(
              insertProjectQuery,
              Object.values(projectData),
            );
            project = insertResult.rows[0];
          } else {
            const { clause, values } = this.buildUpdateSetClause(
              projectData,
              1,
            );
            if (values.length > 0) {
              // Ne pas exécuter de requête UPDATE vide
              await this.queryService.executeQuery(
                `UPDATE projects SET ${clause} WHERE id = $${values.length + 1}`,
                [...values, project.id],
              );
            }
          }
          succeeded++;
        } catch (itemError) {
          this.logger.error(
            `Failed to sync EBP deal ID ${ebpDeal.Id}: ${itemError.message}`,
            itemError.stack,
          );
          errors.push(`Deal ${ebpDeal.Id}: ${itemError.message}`);
          failed++;
        }
      }
    } catch (queryError) {
      this.logger.error(
        `Error fetching deals from EBP view: ${queryError.message}`,
        queryError.stack,
      );
      errors.push(`Critical DB Error (Deals): ${queryError.message}`);
      failed = processed > 0 ? processed - succeeded : ebpDeals.length || 0;
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
    const succeeded = 0;
    const failed = 0;
    const errors: string[] = [];

    try {
      // Vérifier si la vue existe avant de l'interroger
      try {
        const viewCheckResult = await this.queryService.executeQuery(
          "SELECT to_regclass('synced_ebp_sale_documents') IS NOT NULL as exists",
        );
        const viewExists = viewCheckResult.rows[0]?.exists || false;

        if (!viewExists) {
          this.logger.warn(
            "La vue synced_ebp_sale_documents n'existe pas. Retour de tableau vide.",
          );
          return { processed: 0, succeeded: 0, failed: 0, errors: [] };
        }

        // La vue existe, on peut continuer
        const result = await this.queryService.executeQuery(
          'SELECT * FROM synced_ebp_sale_documents',
        );
        const ebpDocs = result.rows as EbpSaleDocumentView[];
        processed = ebpDocs.length;
        this.logger.log(
          `Found ${processed} sale documents to synchronize from EBP view.`,
        );

        // Le reste de la méthode serait implémenté ici
      } catch (viewError) {
        this.logger.warn(
          `Erreur lors de la vérification de la vue synced_ebp_sale_documents: ${viewError.message}. Utilisation d'un tableau vide.`,
        );
        return { processed: 0, succeeded: 0, failed: 0, errors: [] };
      }
    } catch (error) {
      this.logger.error(
        `Error in _syncSaleDocuments: ${error.message}`,
        error.stack,
      );
      errors.push(`Error syncing documents: ${error.message}`);
    }

    return { processed, succeeded, failed, errors };
  }
}
