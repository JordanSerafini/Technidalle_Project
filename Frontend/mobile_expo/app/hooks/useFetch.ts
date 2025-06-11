import { useState, useEffect, useCallback } from 'react';
import { url as urlConfig } from '../utils/url';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: HeadersInit;
  body?: any;
  limit?: number;
  offset?: number;
  searchQuery?: string;
  typeFilter?: string;
  cityFilter?: string;
  statusFilter?: string;
  lastOrderFilter?: string;
  refresh?: string | number;
}

export function useFetch<T>(endpoint: string | null, options: FetchOptions = {}) {
  const [state, setState] = useState<Omit<FetchState<T>, 'refetch'>>({
    data: null,
    loading: true,
    error: null,
  });
  
  // Utiliser un refresh token pour forcer le rafraîchissement des données
  const [refreshToken, setRefreshToken] = useState(0);

  const fetchData = useCallback(async () => {
    // Si l'endpoint est null, ne rien faire
    if (!endpoint) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const abortController = new AbortController();

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Construire l'URL de base
      let url = `${urlConfig.local}${endpoint}`;

      // Construire l'objet de paramètres
      const params: Record<string, string> = {};
      
      // Ajouter les paramètres de pagination et recherche
      if (options.limit !== undefined) {
        params.limit = String(options.limit);
      }
      
      if (options.offset !== undefined) {
        params.offset = String(options.offset);
      }
      
      if (options.searchQuery) {
        params.searchQuery = options.searchQuery;
      }
      
      // Ajouter les paramètres de filtrage
      if (options.typeFilter) {
        params.typeFilter = options.typeFilter;
      }
      
      if (options.cityFilter) {
        params.cityFilter = options.cityFilter;
      }
      
      if (options.statusFilter) {
        params.statusFilter = options.statusFilter;
      }
      
      if (options.lastOrderFilter) {
        params.lastOrderFilter = options.lastOrderFilter;
      }

      // Ajouter le paramètre refresh s'il existe
      if (options.refresh !== undefined) {
        params.refresh = String(options.refresh);
      }

      // Ajouter le token de rafraîchissement pour éviter la mise en cache
      params.refreshToken = String(refreshToken);

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
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'TechnidalleMobileApp/1.0',
          ...(options.method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {}),
        },
        signal: abortController.signal,
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
      
      if (!abortController.signal.aborted) {
        setState({
          data,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Erreur de fetch:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      if (!abortController.signal.aborted) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Une erreur est survenue',
        });
      }
    }

    return () => {
      abortController.abort();
    };
  }, [
    endpoint, 
    options.method, 
    options.limit, 
    options.offset, 
    options.searchQuery,
    options.typeFilter,
    options.cityFilter,
    options.statusFilter,
    options.lastOrderFilter,
    options.refresh,
    refreshToken
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Ajouter la fonction refetch pour forcer un nouveau chargement
  const refetch = useCallback(() => {
    setRefreshToken(prev => prev + 1);
  }, []);

  return {
    ...state,
    refetch
  };
}

export default useFetch; 