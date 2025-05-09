// Définir les types et enums localement au lieu de les importer
// Types de documents
export enum DocumentType {
  DEVIS = 'devis',
  FACTURE = 'facture',
  BON_DE_COMMANDE = 'bon_de_commande',
  BON_DE_LIVRAISON = 'bon_de_livraison',
  AVOIR = 'avoir',
  AUTRE = 'autre',
}

// États des documents
export enum DocumentStatus {
  BROUILLON = 'brouillon',
  EN_ATTENTE = 'en_attente',
  VALIDE = 'valide',
  REFUSE = 'refuse',
  ANNULE = 'annule',
}

// Interface simplifiée pour Document
export interface Document {
  id?: number;
  external_ebp_id?: string;
  project_id: number;
  client_id?: number;
  reference: string;
  type: DocumentType;
  status: DocumentStatus;
  amount?: number;
  tva_rate?: number;
  discount_rate?: number;
  discount_amount?: number;
  issue_date?: Date;
  due_date?: Date;
  payment_date?: Date;
  payment_method?: string;
  payment_terms?: string;
  payment_status?: string;
  notes?: string;
  file_path?: string;
  created_at?: Date;
  updated_at?: Date;
  [key: string]: any;
}

// Interface simplifiée pour Project
export interface Project {
  id: number;
  external_ebp_id: string;
  [key: string]: any;
}

// Interface simplifiée pour Client
export interface Client {
  id: number;
  external_ebp_id: string;
  [key: string]: any;
}

export class SaleDocumentToDocumentMapper {
  static mapEbpDocumentType(ebpType?: number): DocumentType {
    if (ebpType === undefined || ebpType === null) return DocumentType.AUTRE; // Défaut
    // EXEMPLE de mapping - Adaptez à vos valeurs EBP réelles pour DocumentType
    switch (ebpType) {
      case 0:
        return DocumentType.DEVIS; // EBP type 0 = Devis
      case 1:
        return DocumentType.FACTURE; // EBP type 1 = Facture
      case 2:
        return DocumentType.BON_DE_COMMANDE; // EBP type 2 = Bon de commande
      // ... autres types
      default:
        console.warn(`Type de document EBP inconnu: ${ebpType}.`);
        return DocumentType.AUTRE;
    }
  }

  static mapEbpDocumentState(ebpState?: number): DocumentStatus {
    if (ebpState === undefined || ebpState === null)
      return DocumentStatus.BROUILLON; // Défaut
    // EXEMPLE de mapping - Adaptez à vos valeurs EBP réelles pour DocumentState
    switch (ebpState) {
      case 0:
        return DocumentStatus.BROUILLON; // EBP state 0 = Brouillon
      case 1:
        return DocumentStatus.EN_ATTENTE; // EBP state 1 = En attente
      case 2:
        return DocumentStatus.VALIDE; // EBP state 2 = Validé
      // ... autres états
      default:
        console.warn(`État de document EBP inconnu: ${ebpState}.`);
        return DocumentStatus.BROUILLON;
    }
  }

  static toDocumentEntity(
    ebpDoc: any, // Type de votre vue synced_ebp_sale_documents
    internalProjectId: number,
    internalClientId?: number,
    existingDocument?: Partial<Document>,
  ): Partial<Document> {
    const docData: Partial<Document> = {
      ...existingDocument,
      external_ebp_id: ebpDoc.Id, // Ou ebpDoc.EbpDocumentId selon votre vue
      project_id: internalProjectId,
      client_id:
        internalClientId !== undefined
          ? internalClientId
          : existingDocument?.client_id,
      reference: ebpDoc.DocumentNumber || 'N/A',
      type: this.mapEbpDocumentType(ebpDoc.DocumentType),
      status: this.mapEbpDocumentState(ebpDoc.DocumentState),
      amount:
        ebpDoc.NetAmount !== undefined && ebpDoc.NetAmount !== null
          ? Number(ebpDoc.NetAmount)
          : existingDocument?.amount,
      // La table `documents` a tva_rate, discount_rate, discount_amount. Il faudrait les mapper si dispo dans ebpDoc.
      // discount_amount: ebpDoc.DiscountAmountTotal !== undefined ? Number(ebpDoc.DiscountAmountTotal) : existingDocument?.discount_amount,
      issue_date: ebpDoc.DocumentDate
        ? new Date(ebpDoc.DocumentDate)
        : existingDocument?.issue_date,
      // ebp_payload: ebpDoc.ebp_payload_source, // Si colonne et vue configurées
      // approved_by_staff_id: à mapper si ebpDoc.EbpColleagueId est pertinent et mappable à un staff interne
    };

    for (const key in docData) {
      if (docData[key] === undefined) {
        delete docData[key];
      }
    }
    return docData;
  }
}
