import { Injectable, Logger } from '@nestjs/common';
import { DealToProjectMapper } from '../sync/mappers/deal-to-project.mapper';
import { EntityType } from '../interfaces';
import { QueryService } from './query.service';
import { ClientSyncService } from './client-sync.service';
import { ProjectAPP } from '../interfaces';
import { EbpDealView, Project } from '../sync/sync-deals.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly dealToProjectMapper = DealToProjectMapper.getInstance();

  constructor(
    private readonly queryService: QueryService,
    private readonly clientSyncService: ClientSyncService,
  ) {}

  /**
   * Synchronise les données EBP vers l'application
   * @param entityType Type d'entité à synchroniser
   * @param entityId ID de l'entité (optionnel, si null, synchronise toutes les entités du type)
   * @param dbClient Client de base de données
   */
  async syncEntity(entityType: EntityType, entityId?: string): Promise<any> {
    try {
      this.logger.log(
        `Début de synchronisation de ${entityType}${entityId ? ` ID: ${entityId}` : ' (tous)'}`,
      );

      switch (entityType) {
        case EntityType.DEAL:
          return await this.syncDeal(entityId);
        case EntityType.CLIENT:
          return await this.syncClient(entityId);
        case EntityType.PROJECT:
          return await this.syncProject(entityId);
        case EntityType.ITEM:
          return await this.syncItem(entityId);
        case EntityType.DOCUMENT:
          return await this.syncDocument(entityId);
        default:
          throw new Error(
            `Type d'entité non supporté: ${entityType as string}`,
          );
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Erreur lors de la synchronisation de ${entityType}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  /**
   * Synchronise une affaire EBP et crée/met à jour un projet correspondant
   * @param dealId ID de l'affaire EBP
   * @param dbClient Client de base de données
   */
  private async syncDeal(dealId?: string): Promise<any> {
    const query = `
      SELECT * FROM ebp_deals
      ${dealId ? 'WHERE id = $1' : ''}
      ORDER BY id
      LIMIT 100
    `;
    const params = dealId ? [dealId] : [];

    const dealsResult = await this.queryService.executeQuery<EbpDealView>(
      query,
      params,
    );

    // Définir le type explicitement pour éviter l'inférence never[]
    type SyncResult = {
      dealId: any;
      projectId: any;
      operation: string;
    };
    const results: SyncResult[] = [];

    for (const deal of dealsResult.rows) {
      // 1. Synchroniser le client associé à l'affaire
      let clientId: number | null = null;
      const ebpClientIdentifier = deal.xx_Client || deal.EbpClientReference;
      if (ebpClientIdentifier) {
        clientId =
          await this.clientSyncService.syncClientByCustomerId(
            ebpClientIdentifier,
          );
      } else {
        this.logger.warn(
          `Deal ${deal.Id} has no EBP client identifier. Skipping client sync for this deal.`,
        );
      }

      // 2. Vérifier si le projet existe déjà
      const existingProjectQuery = `
        SELECT * FROM projects WHERE external_ebp_id = $1
      `;
      const existingProjectResult =
        await this.queryService.executeQuery<Project>(existingProjectQuery, [
          deal.Id,
        ]);
      const rawExistingProject = existingProjectResult.rows[0] || null;

      // Mapper le projet existant vers Partial<ProjectAPP> si il existe
      const existingProject: Partial<ProjectAPP> | undefined =
        rawExistingProject
          ? {
              id: rawExistingProject.id,
              external_ebp_id: rawExistingProject.external_ebp_id,
              reference: rawExistingProject.reference,
              name: rawExistingProject.name,
              description: rawExistingProject.description,
              client_id:
                rawExistingProject.client_id !== undefined &&
                rawExistingProject.client_id !== null
                  ? String(rawExistingProject.client_id)
                  : rawExistingProject.client_id === null
                    ? null
                    : undefined,
              start_date: rawExistingProject.start_date,
              end_date: rawExistingProject.end_date,
              estimated_duration: rawExistingProject.estimated_duration,
              budget: rawExistingProject.budget,
              actual_cost: rawExistingProject.actual_cost,
              margin: rawExistingProject.margin,
              notes: rawExistingProject.notes,
              deal_id: rawExistingProject.deal_id,
              status: rawExistingProject.status,
            }
          : undefined;

      // 3. Convertir l'affaire en projet
      const projectData = this.dealToProjectMapper.map(
        deal,
        clientId !== null ? clientId : undefined,
        existingProject,
      );

      // 4. Insérer ou mettre à jour le projet
      const upsertQuery = existingProject
        ? `
          UPDATE projects 
          SET 
            name = $1, 
            description = $2, 
            client_id = $3, 
            status = $4, 
            start_date = $5, 
            end_date = $6, 
            budget = $7, 
            actual_cost = $8, 
            margin = $9, 
            notes = $10,
            updated_at = NOW() 
          WHERE external_ebp_id = $11
          RETURNING id
        `
        : `
          INSERT INTO projects (
            name, description, client_id, status, 
            start_date, end_date, budget, actual_cost, 
            margin, notes, external_ebp_id, created_at, updated_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          RETURNING id
        `;

      const upsertParams = [
        projectData.name,
        projectData.description,
        projectData.client_id,
        projectData.status,
        projectData.start_date,
        projectData.end_date,
        projectData.budget,
        projectData.actual_cost,
        projectData.margin,
        projectData.notes,
        deal.Id,
      ];

      const projectResult = await this.queryService.executeQuery<{
        id: number | string;
      }>(upsertQuery, upsertParams);

      results.push({
        dealId: deal.Id,
        projectId: projectResult.rows[0]?.id,
        operation: existingProject ? 'updated' : 'created',
      });
    }

    return {
      entityType: EntityType.DEAL,
      count: results.length,
      results,
    };
  }

  // À implémenter pour les autres types d'entités
  private async syncClient(clientId?: string): Promise<any> {
    // Implémentation à faire
    this.logger.log('syncClient not implemented');
    return { entityType: EntityType.CLIENT, status: 'not_implemented' };
  }

  private async syncProject(projectId?: string): Promise<any> {
    // Implémentation à faire
    this.logger.log('syncProject not implemented');
    return { entityType: EntityType.PROJECT, status: 'not_implemented' };
  }

  private async syncItem(itemId?: string): Promise<any> {
    // Implémentation à faire
    this.logger.log('syncItem not implemented');
    return { entityType: EntityType.ITEM, status: 'not_implemented' };
  }

  private async syncDocument(documentId?: string): Promise<any> {
    // Implémentation à faire
    this.logger.log('syncDocument not implemented');
    return { entityType: EntityType.DOCUMENT, status: 'not_implemented' };
  }
}
