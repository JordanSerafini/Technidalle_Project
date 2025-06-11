import {
  IsString,
  IsOptional,
  IsInt,
  IsISO8601,
  IsEnum,
  IsDecimal,
  IsPositive,
  IsUrl,
  MaxLength,
} from 'class-validator';

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

export interface DocumentLine {
  id: number;
  document_id: number;
  material_id: number | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number | null;
  discount_amount: number | null;
  tax_rate: number | null;
  total_ht: number | null;
  sort_order: number | null;
  created_at: Date | null;
  updated_at: Date | null;
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
  document_lines?: DocumentLine[];
  project?: any;
  client?: any;
  tags?: any[];
}

export class CreateDocumentDto {
  @IsInt()
  project_id: number;

  @IsOptional()
  @IsInt()
  client_id?: number | null;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsString()
  @MaxLength(50)
  reference: string;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus = DocumentStatus.BROUILLON;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  @IsPositive()
  amount?: number | null;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  @IsPositive()
  tva_rate?: number = 20.0;

  @IsISO8601()
  issue_date: Date;

  @IsOptional()
  @IsISO8601()
  due_date?: Date | null;

  @IsOptional()
  @IsISO8601()
  payment_date?: Date | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  payment_method?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @IsUrl()
  file_path?: string | null;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsInt()
  project_id?: number;

  @IsOptional()
  @IsInt()
  client_id?: number | null;

  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  reference?: string;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  @IsPositive()
  amount?: number | null;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  @IsPositive()
  tva_rate?: number;

  @IsOptional()
  @IsISO8601()
  issue_date?: Date;

  @IsOptional()
  @IsISO8601()
  due_date?: Date | null;

  @IsOptional()
  @IsISO8601()
  payment_date?: Date | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  payment_method?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @IsUrl()
  file_path?: string | null;
}

export class CreateDocumentLineDto {
  @IsInt()
  document_id: number;

  @IsOptional()
  @IsInt()
  material_id?: number | null;

  @IsString()
  description: string;

  @IsDecimal({ decimal_digits: '3' })
  @IsPositive()
  quantity: number;

  @IsString()
  unit: string;

  @IsDecimal({ decimal_digits: '2' })
  @IsPositive()
  unit_price: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  discount_percent?: number = 0;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  discount_amount?: number = 0;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  tax_rate?: number = 20.0;

  @IsOptional()
  @IsInt()
  sort_order?: number = 0;
}

export class UpdateDocumentLineDto {
  @IsOptional()
  @IsInt()
  document_id?: number;

  @IsOptional()
  @IsInt()
  material_id?: number | null;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '3' })
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  @IsPositive()
  unit_price?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  discount_percent?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  discount_amount?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  tax_rate?: number;

  @IsOptional()
  @IsInt()
  sort_order?: number;
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

export interface DocumentLineWithMaterial extends DocumentLine {
  material?: Material | null;
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
  lines: DocumentLineWithMaterial[];
  client: Client | null;
  project: Project | null;
  // Totaux calculés
  subtotal_ht: number;
  total_discount: number;
  total_tax: number;
  total_ttc: number;
}
