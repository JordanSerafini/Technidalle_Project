export interface Document {
  id?: number;
  documentId?: string | null;
  project_id: number;
  client_id?: number | null;
  type: DocumentType;
  reference: string;
  status: DocumentStatus;
  amount?: number | null;
  tva_rate?: number | null;
  issue_date: Date;
  due_date?: Date | null;
  payment_date?: Date | null;
  payment_method?: string | null;
  payment_terms?: string | null;
  discount_rate?: number | null;
  discount_amount?: number | null;
  payment_status?: string | null;
  amount_paid?: number | null;
  balance_due?: number | null;
  legal_mentions?: string | null;
  validity_period?: number | null;
  signed_by_client?: boolean | null;
  signed_date?: Date | null;
  approved_by_staff_id?: number | null;
  electronic_signature_path?: string | null;
  version?: number | null;
  parent_document_id?: number | null;
  revision_reason?: string | null;
  quotation_id?: number | null;
  purchase_order_reference?: string | null;
  delivery_address_id?: number | null;
  delivery_date?: Date | null;
  shipping_costs?: number | null;
  notes?: string | null;
  file_path?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export enum DocumentType {
  Devis = 'devis',
  Facture = 'facture',
  BonDeCommande = 'bon_de_commande',
  BonDeLivraison = 'bon_de_livraison',
  FicheTechnique = 'fiche_technique',
  PhotoChantier = 'photo_chantier',
  Plan = 'plan',
  Avoir = 'avoir',
  Acompte = 'acompte',
  Situation = 'situation',
  Autre = 'autre',
}

export enum DocumentStatus {
  Brouillon = 'brouillon',
  EnAttente = 'en_attente',
  Valide = 'valide',
  Refuse = 'refuse',
  Annule = 'annule',
}
