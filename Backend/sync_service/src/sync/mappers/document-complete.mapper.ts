import { Injectable, Logger } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { Document, DocumentType, DocumentStatus } from '../../interfaces/documents/documents.interface';
import { DocumentLine } from '../../interfaces/documents/documentLine.interface';
import { 
  EbpCompleteDocument, 
  AppCompleteDocument, 
  DocumentMapping,
  DocumentMappingRules,
  DocumentValidation,
  ValidationWarning,
  ValidationError,
  DocumentSyncResult
} from '../../interfaces/sync/document-sync.interface';
import { DealsaledocumentInterface, DealsaledocumentlineInterface } from '../../interfaces/Deal/deal.interface';

@Injectable()
export class DocumentCompleteMapper extends BaseMapper<EbpCompleteDocument, AppCompleteDocument> {
  private readonly logger = new Logger(DocumentCompleteMapper.name);

  private readonly defaultMappingRules: DocumentMappingRules = {
    preserve_ebp_references: true,
    merge_duplicate_lines: false,
    validate_project_link: true,
    create_missing_materials: true,
    default_tax_rate: 20.00
  };

  /**
   * Mapping principal : EbpCompleteDocument → AppCompleteDocument
   */
  map(
    ebpCompleteDocument: EbpCompleteDocument,
    projectId: number,
    clientId?: number,
    mappingRules: Partial<DocumentMappingRules> = {}
  ): AppCompleteDocument {
    const rules = { ...this.defaultMappingRules, ...mappingRules };
    
         const appDocument = this.mapDocument(ebpCompleteDocument.document, projectId, rules, clientId);
    const appLines = this.mapDocumentLines(ebpCompleteDocument.lines, rules);

    return {
      document: appDocument,
      lines: appLines,
      project_id: projectId
    };
  }

  /**
   * Mapping avec validation complète
   */
  mapWithValidation(
    ebpCompleteDocument: EbpCompleteDocument,
    projectId: number,
    clientId?: number,
    mappingRules: Partial<DocumentMappingRules> = {}
  ): DocumentMapping {
    const rules = { ...this.defaultMappingRules, ...mappingRules };
    const validation = this.validateDocument(ebpCompleteDocument, projectId, rules);
    
    const appCompleteDocument = this.map(ebpCompleteDocument, projectId, clientId, rules);

    return {
      ebp_document: ebpCompleteDocument,
      app_document: appCompleteDocument,
      mapping_rules: rules,
      validation_result: validation
    };
  }

  /**
   * Mappe un document EBP vers un document application
   */
     private mapDocument(
     ebpDocument: DealsaledocumentInterface,
     projectId: number,
     rules: DocumentMappingRules,
     clientId?: number
   ): Partial<Document> {
         return {
       // external_ebp_id: ebpDocument.Id, // Commenté car pas dans l'interface Document
       project_id: projectId,
       client_id: clientId,
       type: this.mapDocumentType(ebpDocument.DocumentType),
       reference: ebpDocument.DocumentNumber || this.generateReference(ebpDocument),
       status: this.mapDocumentStatus(ebpDocument.DocumentState),
       amount: ebpDocument.NetAmountVatExcludedWithDiscount || ebpDocument.AmountVatExcluded,
       tva_rate: rules.default_tax_rate,
       issue_date: ebpDocument.DocumentDate,
       due_date: undefined, // À déterminer selon les règles métier
       payment_date: undefined,
       payment_method: undefined,
       payment_terms: undefined,
       discount_rate: undefined, // À calculer depuis les lignes
       discount_amount: undefined, // À calculer depuis les lignes
       payment_status: 'non_payé',
       amount_paid: 0,
       balance_due: ebpDocument.NetAmountVatExcludedWithDiscount || ebpDocument.AmountVatExcluded,
       notes: undefined, // Notes pas disponible dans DealsaledocumentInterface
       file_path: undefined,
       // Champs spécifiques EBP préservés si demandé
       ...(rules.preserve_ebp_references && {
         // ebp_document_id: ebpDocument.DocumentId,
         // ebp_deal_id: ebpDocument.DealId
       })
     };
  }

  /**
   * Mappe les lignes de document EBP vers des lignes application
   */
  private mapDocumentLines(
    ebpLines: DealsaledocumentlineInterface[],
    rules: DocumentMappingRules
  ): Partial<DocumentLine>[] {
    const mappedLines: Partial<DocumentLine>[] = [];

    for (let i = 0; i < ebpLines.length; i++) {
      const ebpLine = ebpLines[i];
      
      // Ignorer les lignes de type non-produit selon les règles métier
      if (this.shouldSkipLine(ebpLine)) {
        continue;
      }

      const appLine: Partial<DocumentLine> = {
        // document_id sera défini lors de l'insertion
        material_id: undefined, // À résoudre via ItemId
        description: ebpLine.DescriptionClear || ebpLine.TechnicalDescriptionClear || 'Article sans description',
        quantity: ebpLine.Quantity,
        unit: 'unité', // Valeur par défaut, à adapter selon les besoins
        unit_price: this.calculateUnitPrice(ebpLine),
        discount_percent: this.calculateDiscountPercent(ebpLine),
        discount_amount: this.calculateDiscountAmount(ebpLine),
        tax_rate: rules.default_tax_rate,
        sort_order: ebpLine.LineOrder || i,
        // Champs de traçabilité EBP
        ...(rules.preserve_ebp_references && {
          // ebp_line_id: ebpLine.Id,
          // ebp_item_id: ebpLine.ItemId
        })
      };

      mappedLines.push(appLine);
    }

    return mappedLines;
  }

  /**
   * Valide un document EBP avant mapping
   */
  private validateDocument(
    ebpCompleteDocument: EbpCompleteDocument,
    projectId: number,
    rules: DocumentMappingRules
  ): DocumentValidation {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];
    const missingMaterials: string[] = [];

    // Validation du document principal
    if (!ebpCompleteDocument.document.DocumentNumber) {
      warnings.push({
        code: 'MISSING_REFERENCE',
        message: 'Le document n\'a pas de numéro de référence',
        suggested_action: 'Un numéro sera généré automatiquement'
      });
    }

    if (!ebpCompleteDocument.document.DocumentDate) {
      errors.push({
        code: 'MISSING_DATE',
        message: 'La date du document est obligatoire',
        blocking: true
      });
    }

    // Validation des lignes
    if (ebpCompleteDocument.lines.length === 0) {
      warnings.push({
        code: 'NO_LINES',
        message: 'Le document n\'a aucune ligne',
        suggested_action: 'Vérifier si le document est complet'
      });
    }

    // Vérification des matériaux manquants
    for (const line of ebpCompleteDocument.lines) {
      if (line.ItemId && rules.create_missing_materials) {
        // À implémenter : vérifier si le matériau existe
        // missingMaterials.push(line.ItemId);
      }
    }

    // Validation du lien projet
    const missingProject = rules.validate_project_link && !projectId;

    return {
      is_valid: errors.length === 0,
      warnings,
      errors,
      missing_materials: missingMaterials,
      missing_project: missingProject
    };
  }

  /**
   * Mappe le type de document EBP vers le type application
   */
  private mapDocumentType(ebpType?: number): DocumentType {
    switch (ebpType) {
      case 0: return DocumentType.Devis;
      case 1: return DocumentType.Facture;
      case 2: return DocumentType.BonDeCommande;
      case 3: return DocumentType.BonDeLivraison;
      case 4: return DocumentType.Avoir;
      case 5: return DocumentType.Acompte;
      case 6: return DocumentType.Situation;
      default:
        this.logger.warn(`Type de document EBP inconnu: ${ebpType}`);
        return DocumentType.Autre;
    }
  }

  /**
   * Mappe le statut de document EBP vers le statut application
   */
  private mapDocumentStatus(ebpStatus?: number): DocumentStatus {
    switch (ebpStatus) {
      case 0: return DocumentStatus.Brouillon;
      case 1: return DocumentStatus.EnAttente;
      case 2: return DocumentStatus.Valide;
      case 3: return DocumentStatus.Refuse;
      case 4: return DocumentStatus.Annule;
      default:
        this.logger.warn(`Statut de document EBP inconnu: ${ebpStatus}`);
        return DocumentStatus.Brouillon;
    }
  }

  /**
   * Génère une référence pour les documents sans numéro
   */
  private generateReference(ebpDocument: DealsaledocumentInterface): string {
    const typePrefix = this.getTypePrefix(ebpDocument.DocumentType);
    const timestamp = new Date().getFullYear().toString().slice(-2);
    return `${typePrefix}-${timestamp}-${ebpDocument.Id.slice(-6)}`;
  }

  private getTypePrefix(documentType?: number): string {
    switch (documentType) {
      case 0: return 'DEV';
      case 1: return 'FAC';
      case 2: return 'CMD';
      case 3: return 'BL';
      case 4: return 'AV';
      default: return 'DOC';
    }
  }

  /**
   * Détermine si une ligne doit être ignorée
   */
  private shouldSkipLine(ebpLine: DealsaledocumentlineInterface): boolean {
    // Ignorer les lignes de commentaire ou de titre
    if (ebpLine.LineType === 1 || ebpLine.LineType === 2) {
      return true;
    }
    
    // Ignorer les lignes avec quantité zéro
    if (ebpLine.Quantity <= 0) {
      return true;
    }

    return false;
  }

  /**
   * Calcule le prix unitaire depuis une ligne EBP
   */
  private calculateUnitPrice(ebpLine: DealsaledocumentlineInterface): number {
    if (ebpLine.Quantity <= 0) return 0;
    
    // Utiliser le prix net HT avec remise si disponible
    if (ebpLine.NetAmountVatExcludedWithDiscount) {
      return ebpLine.NetAmountVatExcludedWithDiscount / ebpLine.Quantity;
    }
    
    // Sinon utiliser le montant HT
    if (ebpLine.AmountVatExcluded) {
      return ebpLine.AmountVatExcluded / ebpLine.Quantity;
    }

    return 0;
  }

  /**
   * Calcule le pourcentage de remise
   */
  private calculateDiscountPercent(ebpLine: DealsaledocumentlineInterface): number {
    // À implémenter selon la logique métier EBP
    return 0;
  }

  /**
   * Calcule le montant de remise
   */
  private calculateDiscountAmount(ebpLine: DealsaledocumentlineInterface): number {
    if (ebpLine.AmountVatExcluded && ebpLine.NetAmountVatExcludedWithDiscount) {
      return ebpLine.AmountVatExcluded - ebpLine.NetAmountVatExcludedWithDiscount;
    }
    return 0;
  }

  /**
   * Méthode statique pour compatibilité
   */
  static getInstance(): DocumentCompleteMapper {
    return new DocumentCompleteMapper();
  }

  /**
   * Méthode statique pour mapping simple
   */
  static mapEbpToAppDocument(
    ebpCompleteDocument: EbpCompleteDocument,
    projectId: number,
    clientId?: number
  ): AppCompleteDocument {
    const mapper = DocumentCompleteMapper.getInstance();
    return mapper.map(ebpCompleteDocument, projectId, clientId);
  }
} 