import { DocumentStatus } from './document.interface';

export interface DevisLine {
  id: number;
  document_id: number;
  material_id?: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate?: number;
  total_ht?: number;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  materials?: any;
}

export interface DevisWithLines {
  id: number;
  project_id: number;
  client_id: number | null;
  type: string;
  reference: string;
  status: string | null;
  amount: number | null;
  tva_rate: number | null;
  issue_date: Date;
  due_date?: Date | null;
  payment_date?: Date | null;
  payment_method?: string | null;
  notes?: string | null;
  file_path?: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  projects?: any; // Projet associé
  clients?: any; // Client associé
  lines?: DevisLine[]; // Lignes du devis
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
  sort_order?: number;
}

export interface CreateDevisDto {
  project_id: number;
  client_id: number;
  reference: string;
  status?: DocumentStatus;
  amount?: number;
  tva_rate?: number;
  issue_date?: Date;
  due_date?: Date;
  notes?: string;
  file_path?: string;
  lines?: CreateDevisLineDto[];
}
