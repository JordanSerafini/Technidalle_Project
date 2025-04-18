import { DocumentStatus } from './document.interface';
import { Prisma } from '@prisma/client';

export interface DevisLine {
  id: number;
  document_id: number;
  material_id?: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number | Prisma.Decimal;
  discount_percent?: number | Prisma.Decimal;
  discount_amount?: number | Prisma.Decimal;
  tax_rate?: number | Prisma.Decimal;
  total_ht: number | Prisma.Decimal;
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
  amount: number | Prisma.Decimal | null;
  tva_rate: number | Prisma.Decimal | null;
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
  lines: DevisLine[]; // Lignes du devis
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
  lines: CreateDevisLineDto[];
}

/**
 * Interface pour le résultat de la génération d'un PDF
 */
export interface PdfResult {
  pdfPath: string; // Chemin du fichier sur le disque
  pdfBuffer?: Buffer; // Contenu binaire du PDF (pour transfert entre services)
  filename: string; // Nom du fichier
}
