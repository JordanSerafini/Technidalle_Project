import { DocumentStatus, DocumentType } from './document';

export interface DevisLine {
  id?: number;
  document_id?: number;
  material_id?: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate?: number;
  total_ht?: number;
  sort_order?: number;
  created_at?: Date;
  updated_at?: Date;
  materials?: any;
}

export interface DevisWithLines {
  id?: number;
  project_id?: number;
  client_id?: number;
  type: string;
  reference: string;
  status?: string;
  amount?: number;
  tva_rate?: number;
  issue_date?: Date;
  due_date?: Date;
  payment_date?: Date;
  payment_method?: string;
  notes?: string;
  file_path?: string;
  created_at?: Date;
  updated_at?: Date;
  projects?: any;
  clients?: any;
  lines?: DevisLine[];
}

export interface CreateDevisLineDto {
  material_id?: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate?: number;
}

export interface CreateDevisDto {
  project_id?: number;
  client_id: number;
  reference: string;
  status?: DocumentStatus;
  amount?: number;
  tva_rate?: number;
  issue_date?: Date;
  due_date?: Date;
  notes?: string;
  file_path?: string;
  lines: CreateDevisLineDto[];
} 