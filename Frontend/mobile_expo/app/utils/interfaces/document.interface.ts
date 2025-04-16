export type document_type = 'facture' | 'devis' | 'contrat' | 'photo' | 'autre';

export interface Document {
  id: number;
  name: string;
  description?: string;
  document_type: document_type;
  file_path: string;
  client_id?: number;
  project_id?: number;
  created_at?: Date;
  updated_at?: Date;
  synced_at?: Date;
  synced_by_device_id?: string;
  client?: any;
  project?: any;
}

export interface CreateDocumentDto {
  name: string;
  description?: string;
  document_type: string;
  file_path?: string;
  client_id?: number;
  project_id?: number;
  [key: string]: any;
}

export interface UpdateDocumentDto {
  name?: string;
  description?: string;
  document_type?: string;
  file_path?: string;
  client_id?: number;
  project_id?: number;
} 