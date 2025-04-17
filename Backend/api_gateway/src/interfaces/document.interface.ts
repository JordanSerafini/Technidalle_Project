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
