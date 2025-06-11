import { useState, useEffect } from 'react';
import { url as urlConfig } from '@/app/utils/url';

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
  material?: {
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
  };
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
  start_date: string | null;
  end_date: string | null;
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
  type: string;
  reference: string;
  status: string;
  amount: number | null;
  tva_rate: number;
  issue_date: string;
  due_date: string | null;
  payment_date: string | null;
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
  signed_date: string | null;
  shipping_costs: number;
  notes: string | null;
  file_path: string | null;
  created_at: string;
  updated_at: string;
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

export const useDocumentDetails = (documentId: string | string[]) => {
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${urlConfig.local}documents/${documentId}/details`);
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setDocument(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchDocumentDetails();
    }
  }, [documentId]);

  return { document, loading, error };
}; 