import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { EmailData, MailSummaryResponse, EmailSummaryStats, ResponseLength } from '../utils/types/mailTypes';

// Constante pour l'URL de l'API
const getApiBaseUrl = () => {
  const url = Platform.OS === 'web' 
    ? 'http://localhost:4444' 
    : 'http://192.168.20.225:4444';
  
  console.log(`useMailSummary utilise l'URL: ${url}`);
  return url;
};

type MailSummaryState = {
  overview: string;
  emails: EmailData[];
  stats: EmailSummaryStats | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
};

export const useMailSummary = () => {
  const [state, setState] = useState<MailSummaryState>({
    overview: "",
    emails: [],
    stats: null,
    loading: false,
    error: null,
    refreshing: false
  });

  // Utiliser useRef pour conserver l'URL stable
  const API_BASE_URL = useRef(getApiBaseUrl()).current;
  const MAIL_ENDPOINT = useRef(`${API_BASE_URL}/analyze-email/today/all/summary`).current;

  // Paramètres stockés pour être réutilisés lors des rafraîchissements
  const paramsRef = useRef<{fastMode: boolean, responseLength: ResponseLength}>({
    fastMode: false,
    responseLength: 'normal'
  });

  // Modification de la fonction pour accepter deux paramètres
  const fetchMailSummary = useCallback(async (fastMode: boolean = false, responseLength: ResponseLength = 'normal') => {
    try {
      // Stocker les paramètres pour les réutiliser
      paramsRef.current = { fastMode, responseLength };
      
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Construction de l'URL avec des paramètres de requête
      const queryParams = new URLSearchParams();
      queryParams.append('fastMode', fastMode ? 'true' : 'false');
      queryParams.append('responseLength', responseLength);
      
      const endpoint = `${MAIL_ENDPOINT}?${queryParams.toString()}`;
      console.log(`Récupération des emails depuis: ${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Réponse API reçue:`, JSON.stringify(data).substring(0, 200) + '...');
      
      // Extraction de données de la structure API spécifique
      if (data && data.status === "success") {
        // Adaptation à la nouvelle structure de l'API
        setState(prev => ({
          ...prev,
          overview: data.summary?.overview || "",
          emails: data.data || [],
          stats: {
            totalEmails: data.summary?.totalEmails || 0,
            highPriorityCount: data.summary?.highPriorityCount || 0,
            actionRequiredCount: data.summary?.actionRequiredCount || 0,
            categoryCounts: data.summary?.categoryCounts || {}
          },
          loading: false,
          refreshing: false
        }));

        console.log(`${data.data?.length || 0} emails chargés`);
      } else {
        throw new Error("Format de réponse API inattendu");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        refreshing: false
      }));
      console.error('Erreur lors de la récupération du résumé des emails:', err);
    }
  }, []); // Tableau vide pour s'assurer que la fonction reste stable

  // Mise à jour de onRefresh pour utiliser les derniers paramètres
  const onRefresh = useCallback(() => {
    setState(prev => ({ ...prev, refreshing: true }));
    const { fastMode, responseLength } = paramsRef.current;
    fetchMailSummary(fastMode, responseLength);
  }, [fetchMailSummary]);

  return {
    ...state,
    fetchMailSummary,
    onRefresh
  };
};

export default useMailSummary; 