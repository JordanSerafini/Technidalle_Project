export enum DocumentType {
  DEVIS = 'devis',
  FACTURE = 'facture',
  BON_DE_COMMANDE = 'bon_de_commande',
  BON_DE_LIVRAISON = 'bon_de_livraison',
  FICHE_TECHNIQUE = 'fiche_technique',
  PHOTO_CHANTIER = 'photo_chantier',
  PLAN = 'plan',
  AVOIR = 'avoir',
  ACOMPTE = 'acompte',
  SITUATION = 'situation',
  AUTRE = 'autre',
}

export enum DocumentStatus {
  BROUILLON = 'brouillon',
  EN_ATTENTE = 'en_attente',
  VALIDE = 'valide',
  REFUSE = 'refuse',
  ANNULE = 'annule',
}

export enum MediaType {
  PHOTO = 'photo',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
}

export interface Document {
  id: number;
  project_id: number;
  client_id: number | null;
  type: DocumentType;
  reference: string;
  status: DocumentStatus | null;
  amount: number | null;
  tva_rate: number | null;
  issue_date: Date;
  due_date: Date | null;
  payment_date: Date | null;
  payment_method: string | null;
  notes: string | null;
  file_path: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface DocumentLine {
  id: number;
  document_id: number;
  material_id: number | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  total_ht: number;
  sort_order: number;
  created_at: Date | null;
  updated_at: Date | null;
  material?: Material | null;
}

export interface Material {
  id: number;
  name: string;
  description: string | null;
  reference: string | null;
  unit: string;
  price: number | null;
  stock_quantity: number;
  minimum_stock: number;
  supplier: string | null;
  supplier_reference: string | null;
}

export interface Client {
  id: number;
  customer_id: string | null;
  company_name: string | null;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  mobile: string | null;
  siret: string | null;
  notes: string | null;
}

export interface Project {
  id: number;
  project_id: string | null;
  reference: string;
  name: string;
  description: string | null;
  client_id: number;
  status: string;
  start_date: Date | null;
  end_date: Date | null;
  estimated_duration: number | null;
  budget: number | null;
  actual_cost: number | null;
  margin: number | null;
  priority: number | null;
  notes: string | null;
}

export interface DocumentDetails {
  id: number;
  document_id: string | null;
  project_id: number;
  client_id: number | null;
  type: DocumentType;
  reference: string;
  status: DocumentStatus | null;
  amount: number | null;
  tva_rate: number;
  issue_date: Date;
  due_date: Date | null;
  payment_date: Date | null;
  payment_method: string | null;
  payment_terms: string | null;
  discount_rate: number;
  discount_amount: number;
  payment_status: string;
  amount_paid: number;
  balance_due: number | null;
  legal_mentions: string | null;
  validity_period: number | null;
  signed_by_client: boolean;
  signed_date: Date | null;
  shipping_costs: number;
  notes: string | null;
  file_path: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  // Relations
  lines: DocumentLine[];
  client: Client | null;
  project: Project | null;
  // Totaux calculés
  subtotal_ht: number;
  total_discount: number;
  total_tax: number;
  total_ttc: number;
}

export interface ProjectMedia {
  id: number;
  project_id: number | null;
  stage_id: number | null;
  staff_id: number | null;
  media_type: string | null;
  file_path: string;
  description: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  synced_at: Date | null;
  synced_by_device_id: string | null;
  projects?: any;
  staff?: any;
  project_stages?: any;
}

export interface CreateDocumentDto {
  project_id: number;
  client_id?: number | null;
  type: DocumentType;
  reference: string;
  status?: DocumentStatus | null;
  amount?: number | null;
  tva_rate?: number | null;
  issue_date: Date;
  due_date?: Date | null;
  payment_date?: Date | null;
  payment_method?: string | null;
  notes?: string | null;
  file_path?: string | null;
}

export interface UpdateDocumentDto {
  project_id?: number;
  client_id?: number | null;
  type?: DocumentType;
  reference?: string;
  status?: DocumentStatus | null;
  amount?: number | null;
  tva_rate?: number | null;
  issue_date?: Date;
  due_date?: Date | null;
  payment_date?: Date | null;
  payment_method?: string | null;
  notes?: string | null;
  file_path?: string | null;
}

export interface CreateProjectMediaDto {
  project_id?: number | null;
  stage_id?: number | null;
  staff_id?: number | null;
  media_type?: string | null;
  file_path: string;
  description?: string | null;
}

export interface UpdateProjectMediaDto {
  project_id?: number | null;
  stage_id?: number | null;
  staff_id?: number | null;
  media_type?: string | null;
  file_path?: string;
  description?: string | null;
}
