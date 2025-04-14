export enum DocumentType {
  DEVIS = 'devis',
  FACTURE = 'facture',
  BON_DE_COMMANDE = 'bon_de_commande',
  BON_DE_LIVRAISON = 'bon_de_livraison',
  FICHE_TECHNIQUE = 'fiche_technique',
  PHOTO_CHANTIER = 'photo_chantier',
  PLAN = 'plan',
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
