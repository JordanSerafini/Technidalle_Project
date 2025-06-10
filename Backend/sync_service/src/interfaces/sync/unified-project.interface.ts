import { DealInterface } from '../Deal/deal.interface';
import { ConstructionsiteInterface } from '../projects/constructionSite';
import { ProjectAPP } from '../projects/projectAPP';

/**
 * Interface pour représenter une entité projet unifiée depuis EBP
 * Peut venir d'un Deal ou d'un Project (ConstructionSite)
 */
export interface UnifiedEbpProject {
  id: string;
  name: string;
  description?: string;
  client_id?: string;
  deal_id?: string;
  construction_site_id?: string;
  start_date?: Date;
  end_date?: Date;
  predicted_duration?: number;
  predicted_costs?: number;
  accomplished_costs?: number;
  predicted_sales?: number;
  accomplished_sales?: number;
  predicted_margin?: number;
  status?: number;
  notes?: string;
  source_type: 'deal' | 'construction_site';
  source_data: DealInterface | ConstructionsiteInterface;
}

/**
 * Interface pour les options de synchronisation
 */
export interface SyncOptions {
  force_update?: boolean;
  validate_clients?: boolean;
  sync_documents?: boolean;
  sync_items?: boolean;
  batch_size?: number;
}

/**
 * Interface pour les résultats de synchronisation
 */
export interface SyncResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: SyncError[];
  duration_ms: number;
  details: string;
}

/**
 * Interface pour les erreurs de synchronisation
 */
export interface SyncError {
  entity_type: string;
  entity_id: string;
  error_code: string;
  error_message: string;
  context?: any;
}

/**
 * Interface pour le mapping de projet unifié
 */
export interface UnifiedProjectMapping {
  app_project: Partial<ProjectAPP>;
  ebp_project: UnifiedEbpProject;
  mapping_confidence: number; // 0-1, confiance dans le mapping
  conflicts: MappingConflict[];
}

/**
 * Interface pour les conflits de mapping
 */
export interface MappingConflict {
  field: string;
  ebp_value: any;
  app_value: any;
  resolution: 'keep_ebp' | 'keep_app' | 'merge' | 'manual';
  reason: string;
} 