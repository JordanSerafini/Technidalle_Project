import { useState, useEffect } from '@lynx-js/react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: HeadersInit;
  body?: any;
}

const API_BASE_URL = 'http://192.168.20.200:3000/';

// Fonction pour vérifier la connexion
const checkConnection = async (url: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Erreur de vérification de connexion:', error);
    return false;
  }
};

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

        const url = `${API_BASE_URL}${endpoint}`;
        console.log('Tentative de connexion à:', url);

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
  }, [endpoint, options.method]);

  return state;
} 