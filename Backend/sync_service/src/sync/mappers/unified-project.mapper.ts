import { Injectable, Logger } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { ProjectAPP } from '../../interfaces/projects/projectAPP';
import { DealInterface } from '../../interfaces/Deal/deal.interface';
import { ConstructionsiteInterface } from '../../interfaces/projects/constructionSite';
import { 
  UnifiedEbpProject, 
  UnifiedProjectMapping, 
  MappingConflict 
} from '../../interfaces/sync/unified-project.interface';

export enum ProjectStatus {
  PROSPECT = 'prospect',
  DEVIS_EN_COURS = 'devis_en_cours',
  DEVIS_ACCEPTE = 'devis_accepte',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  ANNULE = 'annule',
}

@Injectable()
export class UnifiedProjectMapper extends BaseMapper<UnifiedEbpProject, Partial<ProjectAPP>> {
  private readonly logger = new Logger(UnifiedProjectMapper.name);

  /**
   * Convertit un Deal EBP en UnifiedEbpProject
   */
  dealToUnified(deal: DealInterface): UnifiedEbpProject {
    return {
      id: deal.Id,
      name: deal.Caption || 'Affaire sans nom',
      description: deal.Notes || deal.NotesClear,
      client_id: deal.xx_Client,
      deal_id: deal.Id,
      construction_site_id: undefined,
      start_date: deal.xx_DateDebut,
      end_date: deal.xx_DateFin,
      predicted_duration: deal.PredictedDuration,
      predicted_costs: deal.PredictedCosts,
      accomplished_costs: deal.AccomplishedCosts,
      predicted_sales: deal.PredictedSales,
      accomplished_sales: deal.AccomplishedSales,
      predicted_margin: deal.PredictedGrossMargin,
      status: deal.DealState,
      notes: deal.Notes,
      source_type: 'deal',
      source_data: deal
    };
  }

  /**
   * Convertit un ConstructionSite EBP en UnifiedEbpProject
   */
  constructionSiteToUnified(constructionSite: ConstructionsiteInterface): UnifiedEbpProject {
    return {
      id: constructionSite.Id,
      name: constructionSite.Caption || 'Chantier sans nom',
      description: constructionSite.NotesClear || constructionSite.Notes,
      client_id: constructionSite.CustomerId || undefined,
      deal_id: constructionSite.DealId,
      construction_site_id: constructionSite.Id,
      start_date: constructionSite.StartDate,
      end_date: constructionSite.EndDate,
      predicted_duration: constructionSite.PredictedDuration,
      predicted_costs: constructionSite.PredictedCosts,
      accomplished_costs: constructionSite.AccomplishedCosts,
      predicted_sales: constructionSite.PredictedSales,
      accomplished_sales: constructionSite.AccomplishedSales,
      predicted_margin: constructionSite.PredictedGrossMargin,
      status: constructionSite.Status,
      notes: constructionSite.Notes,
      source_type: 'construction_site',
      source_data: constructionSite
    };
  }

  /**
   * Mapping principal : UnifiedEbpProject → ProjectAPP
   */
  map(
    unifiedProject: UnifiedEbpProject,
    clientId?: number,
    existingProject?: Partial<ProjectAPP>
  ): Partial<ProjectAPP> {
    const projectData: Partial<ProjectAPP> = {
      ...existingProject,
      external_ebp_id: unifiedProject.id,
      name: unifiedProject.name,
      reference: this.generateReference(unifiedProject),
      description: unifiedProject.description || existingProject?.description,
      client_id: clientId !== undefined ? String(clientId) : existingProject?.client_id,
      status: this.mapStatusToProjectStatus(unifiedProject.status),
      start_date: unifiedProject.start_date || existingProject?.start_date,
      end_date: unifiedProject.end_date || existingProject?.end_date,
      estimated_duration: unifiedProject.predicted_duration || existingProject?.estimated_duration,
      budget: unifiedProject.predicted_sales || existingProject?.budget,
      actual_cost: unifiedProject.accomplished_costs || existingProject?.actual_cost,
      margin: unifiedProject.predicted_margin || existingProject?.margin,
      notes: this.mergeNotes(unifiedProject.notes, existingProject?.notes),
      deal_id: unifiedProject.deal_id || existingProject?.deal_id,
    };

    return this.cleanUndefinedProperties(projectData);
  }

  /**
   * Mapping intelligent avec détection de conflits
   */
  mapWithConflictDetection(
    unifiedProject: UnifiedEbpProject,
    existingProject?: Partial<ProjectAPP>,
    clientId?: number
  ): UnifiedProjectMapping {
    const conflicts: MappingConflict[] = [];
    
    // Détecter les conflits potentiels
    if (existingProject) {
      conflicts.push(...this.detectConflicts(unifiedProject, existingProject));
    }

    const mappedProject = this.map(unifiedProject, clientId, existingProject);
    
    // Calculer la confiance du mapping
    const confidence = this.calculateMappingConfidence(unifiedProject, existingProject, conflicts);

    return {
      app_project: mappedProject,
      ebp_project: unifiedProject,
      mapping_confidence: confidence,
      conflicts
    };
  }

  /**
   * Génère une référence unique pour le projet
   */
  private generateReference(unifiedProject: UnifiedEbpProject): string {
    const prefix = unifiedProject.source_type === 'deal' ? 'AFF' : 'CHT';
    const timestamp = new Date().getFullYear().toString().slice(-2);
    return `${prefix}-${timestamp}-${unifiedProject.id}`;
  }

  /**
   * Mappe le statut EBP vers le statut application
   */
  private mapStatusToProjectStatus(status?: number): ProjectStatus {
    if (status === undefined || status === null) return ProjectStatus.PROSPECT;

    switch (status) {
      case 0: return ProjectStatus.PROSPECT;
      case 1: return ProjectStatus.DEVIS_EN_COURS;
      case 2: return ProjectStatus.DEVIS_ACCEPTE;
      case 3: return ProjectStatus.EN_COURS;
      case 4: return ProjectStatus.TERMINE;
      case 5: return ProjectStatus.ANNULE;
      default:
        this.logger.warn(`Statut EBP inconnu: ${status}, affectation à 'PROSPECT'`);
        return ProjectStatus.PROSPECT;
    }
  }

  /**
   * Fusionne les notes intelligemment
   */
  private mergeNotes(ebpNotes?: string, appNotes?: string | null): string | undefined {
    if (!ebpNotes && !appNotes) return undefined;
    if (!ebpNotes) return appNotes || undefined;
    if (!appNotes) return ebpNotes;
    
    // Éviter la duplication si les notes sont identiques
    if (ebpNotes.trim() === appNotes.trim()) return ebpNotes;
    
    return `${appNotes}\n\n--- EBP ---\n${ebpNotes}`;
  }

  /**
   * Détecte les conflits entre projet EBP et projet existant
   */
  private detectConflicts(
    unifiedProject: UnifiedEbpProject, 
    existingProject: Partial<ProjectAPP>
  ): MappingConflict[] {
    const conflicts: MappingConflict[] = [];

    // Conflit de nom
    if (existingProject.name && existingProject.name !== unifiedProject.name) {
      conflicts.push({
        field: 'name',
        ebp_value: unifiedProject.name,
        app_value: existingProject.name,
        resolution: 'keep_ebp',
        reason: 'EBP est la source de vérité pour les noms de projet'
      });
    }

    // Conflit de dates
    if (existingProject.start_date && unifiedProject.start_date && 
        existingProject.start_date.getTime() !== unifiedProject.start_date.getTime()) {
      conflicts.push({
        field: 'start_date',
        ebp_value: unifiedProject.start_date,
        app_value: existingProject.start_date,
        resolution: 'keep_ebp',
        reason: 'Les dates EBP sont prioritaires'
      });
    }

    // Conflit de budget
    if (existingProject.budget && unifiedProject.predicted_sales &&
        Math.abs(Number(existingProject.budget) - unifiedProject.predicted_sales) > 0.01) {
      conflicts.push({
        field: 'budget',
        ebp_value: unifiedProject.predicted_sales,
        app_value: existingProject.budget,
        resolution: 'keep_ebp',
        reason: 'Les montants EBP sont la référence'
      });
    }

    return conflicts;
  }

  /**
   * Calcule la confiance du mapping
   */
  private calculateMappingConfidence(
    unifiedProject: UnifiedEbpProject,
    existingProject?: Partial<ProjectAPP>,
    conflicts: MappingConflict[] = []
  ): number {
    let confidence = 1.0;

    // Réduire la confiance selon le nombre de conflits
    confidence -= conflicts.length * 0.1;

    // Réduire si des champs essentiels manquent
    if (!unifiedProject.name) confidence -= 0.3;
    if (!unifiedProject.client_id) confidence -= 0.2;
    if (!unifiedProject.start_date) confidence -= 0.1;

    // Bonus si c'est une mise à jour d'un projet existant
    if (existingProject) confidence += 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Méthode statique pour compatibilité
   */
  static getInstance(): UnifiedProjectMapper {
    return new UnifiedProjectMapper();
  }

  /**
   * Méthodes statiques pour l'API existante
   */
  static mapDealToProject(
    deal: DealInterface,
    clientId?: number,
    existingProject?: Partial<ProjectAPP>
  ): Partial<ProjectAPP> {
    const mapper = UnifiedProjectMapper.getInstance();
    const unified = mapper.dealToUnified(deal);
    return mapper.map(unified, clientId, existingProject);
  }

  static mapConstructionSiteToProject(
    constructionSite: ConstructionsiteInterface,
    clientId?: number,
    existingProject?: Partial<ProjectAPP>
  ): Partial<ProjectAPP> {
    const mapper = UnifiedProjectMapper.getInstance();
    const unified = mapper.constructionSiteToUnified(constructionSite);
    return mapper.map(unified, clientId, existingProject);
  }
} 