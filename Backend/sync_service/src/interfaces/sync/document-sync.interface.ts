import { Document } from '../documents/documents.interface';
import { DocumentLine } from '../documents/documentLine.interface';
import { DealsaledocumentInterface, DealsaledocumentlineInterface } from '../Deal/deal.interface';

/**
 * Interface pour un document EBP complet avec ses lignes
 */
export interface EbpCompleteDocument {
  document: DealsaledocumentInterface;
  lines: DealsaledocumentlineInterface[];
  deal_id?: string;
  construction_site_id?: string;
}

/**
 * Interface pour un document application complet avec ses lignes
 */
export interface AppCompleteDocument {
  document: Partial<Document>;
  lines: Partial<DocumentLine>[];
  project_id: number;
}

/**
 * Interface pour le mapping de document
 */
export interface DocumentMapping {
  ebp_document: EbpCompleteDocument;
  app_document: AppCompleteDocument;
  mapping_rules: DocumentMappingRules;
  validation_result: DocumentValidation;
}

/**
 * Règles de mapping pour les documents
 */
export interface DocumentMappingRules {
  preserve_ebp_references: boolean;
  merge_duplicate_lines: boolean;
  validate_project_link: boolean;
  create_missing_materials: boolean;
  default_tax_rate: number;
}

/**
 * Résultat de validation de document
 */
export interface DocumentValidation {
  is_valid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
  missing_materials: string[];
  missing_project: boolean;
}

/**
 * Interface pour les avertissements de validation
 */
export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  suggested_action?: string;
}

/**
 * Interface pour les erreurs de validation
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  blocking: boolean;
}

/**
 * Options de synchronisation des documents
 */
export interface DocumentSyncOptions {
  include_lines: boolean;
  create_missing_materials: boolean;
  validate_amounts: boolean;
  preserve_line_order: boolean;
  batch_size: number;
  document_types_filter?: string[];
}

/**
 * Résultat de synchronisation de document
 */
export interface DocumentSyncResult {
  document_id?: number;
  lines_created: number;
  materials_created: number;
  warnings: string[];
  errors: string[];
  skipped_lines: number;
} 