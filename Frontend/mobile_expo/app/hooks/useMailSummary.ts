import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { EmailData, MailSummaryResponse, EmailSummaryStats } from '../utils/types/mailTypes';

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
    loading: true,
    error: null,
    refreshing: false
  });

  // Utiliser useRef pour conserver l'URL stable
  const API_BASE_URL = useRef(
    Platform.OS === 'web' 
      ? 'http://localhost:4444' 
      : 'http://192.168.20.225:4444'
  ).current;

  const MAIL_ENDPOINT = useRef(`${API_BASE_URL}/analyze-email/today/all/summary`).current;

  // Utiliser un tableau vide de dépendances pour s'assurer que la fonction ne change jamais
  const fetchMailSummary = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      console.log(`Récupération des emails depuis: ${MAIL_ENDPOINT}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000);
      
      const response = await fetch(MAIL_ENDPOINT, {
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

  const onRefresh = useCallback(() => {
    setState(prev => ({ ...prev, refreshing: true }));
    fetchMailSummary();
  }, [fetchMailSummary]);

  return {
    ...state,
    fetchMailSummary,
    onRefresh
  };
};

export default useMailSummary; 