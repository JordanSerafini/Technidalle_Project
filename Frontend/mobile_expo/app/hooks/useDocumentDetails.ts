import { useState, useEffect, useCallback } from 'react';
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

interface DocumentDetailsState {
  document: DocumentDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDocumentDetails = (documentId: string | string[] | null) => {
  const [state, setState] = useState<Omit<DocumentDetailsState, 'refetch'>>({
    document: null,
    loading: true,
    error: null,
  });

  // Utiliser un refresh token pour forcer le rafraîchissement des données
  const [refreshToken, setRefreshToken] = useState(0);

  const fetchDocumentDetails = useCallback(async () => {
    // Si l'documentId est null, ne rien faire
    if (!documentId) {
      setState({ document: null, loading: false, error: null });
      return;
    }

    const abortController = new AbortController();

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Construire l'URL avec le paramètre de rafraîchissement
      const url = `${urlConfig.local}documents/${documentId}/details?refreshToken=${refreshToken}`;

      console.log('Fetch Document Details URL:', url);

      const requestOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'TechnidalleMobileApp/1.0',
        },
        signal: abortController.signal,
      };

      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Document details reçu:', data.reference || 'Pas de référence');
      
      if (!abortController.signal.aborted) {
        setState({
          document: data,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Erreur de fetch document details:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      if (!abortController.signal.aborted) {
        setState({
          document: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Une erreur est survenue',
        });
      }
    }

    return () => {
      abortController.abort();
    };
  }, [documentId, refreshToken]);

  useEffect(() => {
    fetchDocumentDetails();
  }, [fetchDocumentDetails]);

  // Ajouter la fonction refetch pour forcer un nouveau chargement
  const refetch = useCallback(() => {
    setRefreshToken(prev => prev + 1);
  }, []);

  return {
    ...state,
    refetch
  };
}; 