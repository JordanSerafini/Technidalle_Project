import { Injectable, Logger } from '@nestjs/common';
import { DealToProjectMapper } from '../sync/mappers/deal-to-project.mapper';
import { EntityType } from '../interfaces';
import { QueryService } from './query.service';
import { ClientSyncService } from './client-sync.service';
import { ProjectAPP } from '../interfaces/projects/projectAPP';

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
  async syncEntity(
    entityType: EntityType,
    entityId?: string,
    dbClient?: any,
  ): Promise<any> {
    try {
      this.logger.log(
        `Début de synchronisation de ${entityType}${entityId ? ` ID: ${entityId}` : ' (tous)'}`,
      );

      switch (entityType) {
        case EntityType.DEAL:
          return await this.syncDeal(entityId);
        case EntityType.CLIENT:
          return await this.syncClient(entityId, dbClient);
        case EntityType.PROJECT:
          return await this.syncProject(entityId, dbClient);
        case EntityType.ITEM:
          return await this.syncItem(entityId, dbClient);
        case EntityType.DOCUMENT:
          return await this.syncDocument(entityId, dbClient);
        default:
          throw new Error(`Type d'entité non supporté: ${entityType}`);
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de la synchronisation de ${entityType}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Synchronise une affaire EBP et crée/met à jour un projet correspondant
   * @param dealId ID de l'affaire EBP
   */
  private async syncDeal(dealId?: string): Promise<any> {
    const query = `
      SELECT * FROM ebp_deals
      ${dealId ? 'WHERE id = $1' : ''}
      ORDER BY id
      LIMIT 100
    `;
    const params = dealId ? [dealId] : [];

    const dealsResult = await this.queryService.executeQuery(query, params);
    
    // Définir le type explicitement pour éviter l'inférence never[]
    type SyncResult = {
      dealId: any;
      projectId: any;
      operation: string;
    };
    const results: SyncResult[] = [];

    for (const deal of dealsResult.rows) {
      // 1. Synchroniser le client associé à l'affaire
      const clientId = await this.clientSyncService.syncClientByCustomerId(
        deal.xx_Client || deal.EbpClientReference,
      );

      // 2. Vérifier si le projet existe déjà
      const existingProjectQuery = `
        SELECT * FROM projects WHERE external_ebp_id = $1
      `;
      const existingProjectResult = await this.queryService.executeQuery(
        existingProjectQuery,
        [deal.Id],
      );
      const existingProject = existingProjectResult.rows[0] || null;

      // 3. Convertir l'affaire en projet
      const projectData = this.dealToProjectMapper.map(
        deal,
        clientId !== null ? clientId : undefined,
        existingProject,
      ) as ProjectAPP & { status: string };

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

      const projectResult = await this.queryService.executeQuery(
        upsertQuery,
        upsertParams,
      );

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
  private async syncClient(clientId?: string, dbClient?: any): Promise<any> {
    // Implémentation à faire
    return { entityType: EntityType.CLIENT, status: 'not_implemented' };
  }

  private async syncProject(projectId?: string, dbClient?: any): Promise<any> {
    // Implémentation à faire
    return { entityType: EntityType.PROJECT, status: 'not_implemented' };
  }

  private async syncItem(itemId?: string, dbClient?: any): Promise<any> {
    // Implémentation à faire
    return { entityType: EntityType.ITEM, status: 'not_implemented' };
  }

  private async syncDocument(
    documentId?: string,
    dbClient?: any,
  ): Promise<any> {
    // Implémentation à faire
    return { entityType: EntityType.DOCUMENT, status: 'not_implemented' };
  }
}
