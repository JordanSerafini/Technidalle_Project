import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { EmailData, MailSummaryResponse, EmailSummaryStats, ResponseLength } from '../utils/types/mailTypes';
// Import des données mock
import { dailyMailsMock as mockData } from '../utils/data/dailyMails.mock';
// Import des fonctions de gestion du mode de données
import { getDataMode } from '../utils/functions/mails.function';
// Import du store
import { useMailsStore } from '../store/mailsStore';
// Import des fonctions optimisées
import { fetchEmailsRequiringResponse } from '../utils/functions/mails.function';

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
  // Utiliser le store pour le chargement et les emails
  const { isLoading, actionRequiredEmails, shouldRefetch } = useMailsStore();
  
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
  const paramsRef = useRef<{fastMode: boolean, responseLength: ResponseLength, forceRefresh: boolean}>({
    fastMode: false,
    responseLength: 'normal',
    forceRefresh: false
  });
  
  // Effet pour synchroniser les emails du store
  useEffect(() => {
    if (actionRequiredEmails.length > 0) {
      setState(prev => ({
        ...prev,
        emails: actionRequiredEmails,
        stats: calculateStats(actionRequiredEmails),
        overview: `Vous avez ${actionRequiredEmails.length} emails nécessitant une réponse aujourd'hui.`
      }));
    }
  }, [actionRequiredEmails]);
  
  // Effet pour synchroniser l'état de chargement avec le store
  useEffect(() => {
    setState(prev => ({
      ...prev,
      loading: isLoading,
      refreshing: isLoading && prev.refreshing
    }));
  }, [isLoading]);
  
  // Fonction pour calculer les statistiques à partir des emails
  const calculateStats = (emails: EmailData[]): EmailSummaryStats => {
    const stats: EmailSummaryStats = {
      totalEmails: emails.length,
      highPriorityCount: 0,
      actionRequiredCount: 0,
      categoryCounts: {}
    };
    
    emails.forEach(email => {
      // Compter les emails prioritaires
      if (email.analysis?.priority === 'high') {
        stats.highPriorityCount++;
      }
      
      // Compter les emails nécessitant une action
      if (email.analysis?.actionRequired) {
        stats.actionRequiredCount++;
      }
      
      // Compter par catégorie
      const category = email.analysis?.category || 'Non classé';
      stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;
    });
    
    return stats;
  };

  // Modification de la fonction pour utiliser fetchEmailsRequiringResponse
  const fetchMailSummary = useCallback(async (
    fastMode: boolean = false, 
    responseLength: ResponseLength = 'normal',
    forceRefresh: boolean = false
  ) => {
    try {
      // Stocker les paramètres pour les réutiliser
      paramsRef.current = { fastMode, responseLength, forceRefresh };
      
      // Vérifier si on peut utiliser le cache
      if (!forceRefresh && !shouldRefetch() && actionRequiredEmails.length > 0) {
        console.log('[STORE] Utilisation des données en cache dans useMailSummary');
        
        // Même si on utilise les données en cache, toujours charger le résumé complet
        try {
          await fetchSummaryOnly(fastMode, responseLength);
        } catch (summaryError) {
          console.error('Erreur lors de la récupération du résumé depuis le cache:', summaryError);
        }
        
        return;
      }
      
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Utiliser la fonction optimisée qui utilise le store
      const emails = await fetchEmailsRequiringResponse(fastMode, forceRefresh);
      
      // Si l'API ne retourne pas correctement les données, on utilise une solution de secours
      if (!emails || emails.length === 0) {
        // Utilisation des données mock comme solution de secours
        const useMockData = getDataMode();
        if (useMockData) {
          console.log(`[MOCK] Utilisation des données mock comme solution de secours`);
          
          setState(prev => ({
            ...prev,
            // Utiliser le résumé détaillé fourni dans les données mockées
            overview: mockData.summary.overview || `Vous avez ${mockData.data.length} emails nécessitant une réponse aujourd'hui.`,
            emails: mockData.data || [],
            stats: {
              totalEmails: mockData.summary.totalEmails || mockData.data.length || 0,
              highPriorityCount: mockData.summary.highPriorityCount || mockData.data.filter(e => e.analysis?.priority === 'high').length || 0,
              actionRequiredCount: mockData.summary.actionRequiredCount || mockData.data.filter(e => e.analysis?.actionRequired).length || 0,
              categoryCounts: mockData.summary.categoryCounts || {}
            },
            loading: false,
            refreshing: false
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: "Aucun email n'a pu être récupéré",
            loading: false,
            refreshing: false
          }));
        }
        return;
      }
      
      // Toujours faire un appel séparé pour le résumé complet
      await fetchSummaryOnly(fastMode, responseLength);
      
      // L'état de chargement est réinitialisé dans fetchSummaryOnly
      console.log(`${emails.length} emails chargés via fetchEmailsRequiringResponse`);
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
  }, [actionRequiredEmails, shouldRefetch, API_BASE_URL]);

  // Fonction séparée pour récupérer uniquement le résumé
  const fetchSummaryOnly = async (fastMode: boolean, responseLength: ResponseLength) => {
    try {
      // Indiquer que le résumé est en cours de chargement
      setState(prev => ({ ...prev, loading: true }));
      
      // Vérifier si on utilise les données mockées
      const useMockData = getDataMode();
      if (useMockData) {
        console.log('[MOCK] Utilisation des données mockées pour le résumé');
        
        // Simuler un délai
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Utiliser le résumé des données mockées
        setState(prev => ({
          ...prev,
          overview: mockData.summary.overview || `Vous avez ${prev.emails.length} emails nécessitant une réponse aujourd'hui.`,
          stats: {
            totalEmails: mockData.summary.totalEmails || prev.emails.length,
            highPriorityCount: mockData.summary.highPriorityCount || 0,
            actionRequiredCount: mockData.summary.actionRequiredCount || 0,
            categoryCounts: mockData.summary.categoryCounts || {}
          },
          loading: false,
          refreshing: false
        }));
        
        return true;
      }
      
      // Si on n'utilise pas les données mockées, continuer avec l'appel API
      const queryParams = new URLSearchParams();
      queryParams.append('fastMode', fastMode ? 'true' : 'false');
      queryParams.append('responseLength', responseLength);
      
      const summaryEndpoint = `${API_BASE_URL}/analyze-email/today/all/summary?${queryParams.toString()}`;
      console.log(`[API] Récupération du résumé depuis: ${summaryEndpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(summaryEndpoint, {
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
      
      const summaryData = await response.json();
      console.log('[API] Réponse du résumé reçue:', summaryData);
      
      if (summaryData && summaryData.status === "success" && summaryData.summary) {
        // Afficher le résumé complet pour le débogage
        console.log('[API] Résumé complet:', summaryData.summary);
        console.log('[API] Aperçu du résumé:', summaryData.summary.overview?.substring(0, 50));
        
        // Utiliser directement le résumé fourni par l'API
        setState(prev => ({
          ...prev,
          overview: summaryData.summary.overview || `Vous avez ${prev.emails.length} emails nécessitant une réponse aujourd'hui.`,
          stats: {
            totalEmails: summaryData.summary.totalEmails || prev.emails.length,
            highPriorityCount: summaryData.summary.highPriorityCount || 0,
            actionRequiredCount: summaryData.summary.actionRequiredCount || 0,
            categoryCounts: summaryData.summary.categoryCounts || {}
          },
          loading: false,
          refreshing: false
        }));
        
        return true;
      } else {
        console.error('[API] Format inattendu pour le résumé:', summaryData);
        throw new Error("Format de réponse API inattendu pour le résumé");
      }
    } catch (summaryError) {
      console.error('Erreur lors de la récupération du résumé détaillé:', summaryError);
      
      // En cas d'erreur, on utilise quand même les emails déjà chargés avec un résumé basique
      setState(prev => ({
        ...prev, 
        loading: false,
        refreshing: false
      }));
      
      return false;
    }
  };

  // Mise à jour de onRefresh pour utiliser les derniers paramètres
  const onRefresh = useCallback(() => {
    setState(prev => ({ ...prev, refreshing: true }));
    const { fastMode, responseLength, forceRefresh } = paramsRef.current;
    fetchMailSummary(fastMode, responseLength, true); // Force le rafraîchissement pendant un pull-to-refresh
  }, [fetchMailSummary]);

  return {
    ...state,
    fetchMailSummary,
    onRefresh
  };
};

export default useMailSummary; 