import { useState, useEffect } from 'react';
import { url as urlConfig } from '../utils/url';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: HeadersInit;
  body?: any;
  limit?: number;
  offset?: number;
  searchQuery?: string;
}


export function useFetch<T>(endpoint: string, options: FetchOptions = {}) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    let controller = new AbortController();

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Construire l'URL de base
        let url = `${urlConfig.local}${endpoint}`;

        // Construire l'objet de paramètres
        const params: Record<string, string> = {};
        
        // Ajouter les paramètres de pagination et recherche
        if (options.limit !== undefined) {
          params.limit = String(options.limit);
        } else {
          params.limit = '10'; 
        }
        
        if (options.offset !== undefined) {
          params.offset = String(options.offset);
        }
        
        if (options.searchQuery) {
          params.searchQuery = options.searchQuery;
        }

        // Conversion des paramètres en chaîne de requête
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          queryParams.append(key, value);
        });

        const queryString = queryParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }

        console.log('Fetch URL avec paramètres:', url);
        console.log('Params envoyés:', params);

        const requestOptions: RequestInit = {
          method: options.method || 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            ...(options.method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {}),
          },
          signal: controller.signal,
        };

        if (options.body) {
          requestOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('Données reçues:', data.length || 'Pas un tableau ou vide');
        
        if (isMounted) {
          setState({
            data,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Erreur de fetch:', error);
        if (isMounted) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Une erreur est survenue',
          });
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [endpoint, options.method, options.limit, options.offset, options.searchQuery]);

  return state;
}

export default useFetch; 