import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { EmailData, MailSummaryResponse, EmailSummaryStats, ResponseLength } from '../../Frontend/mobile_expo/app/utils/types/mailTypes';
// Import des données mock
import { dailyMailsMock as mockData } from '../../Frontend/mobile_expo/app/utils/data/dailyMails.mock';
// Import des fonctions de gestion du mode de données
import { getDataMode } from './2email/mails.function';
// Import du store
import { useMailsStore } from '../../Frontend/mobile_expo/app/store/mailsStore';
// Import des fonctions optimisées
import { fetchEmailsRequiringResponse } from './2email/mails.function';
import urlConfig from '@/app/utils/url';

// Constante pour l'URL de l'API
const getApiBaseUrl = () => {
  const apiUrl = Platform.OS === 'web' 
    ? urlConfig.email
    : urlConfig.email;
  
  console.log(`useMailSummary utilise l'URL: ${apiUrl}`);
  return apiUrl;
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
  // const MAIL_ENDPOINT = useRef(`${API_BASE_URL}/analyze-email/today/all/summary`).current; // Plus utilisé directement

  // Paramètres stockés pour être réutilisés lors des rafraîchissements
  const paramsRef = useRef<{fastMode: boolean, forceRefresh: boolean}>({
    fastMode: false,
    forceRefresh: false
  });
  
  // Effet pour synchroniser les emails du store
  useEffect(() => {
    if (actionRequiredEmails.length > 0) {
      setState(prev => {
        const newStats = calculateStats(actionRequiredEmails);
        let newOverview = prev.overview;

        // Si l'aperçu actuel est vide ou est toujours le générique,
        // et que nous ne sommes pas en train de charger activement le résumé détaillé,
        // mettre à jour vers le générique.
        // fetchMailSummary est responsable de setter l'aperçu détaillé.
        if ((!prev.overview || prev.overview.startsWith("Vous avez")) && !prev.loading) {
          newOverview = `Vous avez ${actionRequiredEmails.length} emails nécessitant une réponse aujourd'hui.`;
        }
        
        return {
          ...prev,
          emails: actionRequiredEmails,
          stats: newStats,
          overview: newOverview
        };
      });
    } else if (!isLoading) { // S'il n'y a pas d'emails et qu'on ne charge pas
      setState(prev => ({
        ...prev,
        emails: [],
        stats: null,
        overview: "Aucun email ne nécessite de réponse pour le moment."
      }));
    }
  }, [actionRequiredEmails, isLoading]); // Ajout de isLoading pour éviter écrasement pendant chargement initial
  
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
    forceRefresh: boolean = false
  ) => {
    try {
      // S'assurer que forceRefresh est un booléen, même si mal appelé
      const trulyForceRefresh = typeof forceRefresh === 'boolean' ? forceRefresh : false;

      paramsRef.current = { fastMode, forceRefresh: trulyForceRefresh };
      const useMockData = getDataMode();

      if (useMockData) {
        console.log('[MOCK] Utilisation des données mock pour tout');
        setState(prev => ({ ...prev, loading: true, error: null, refreshing: trulyForceRefresh }));
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const store = useMailsStore.getState();
        store.setActionRequiredEmails(mockData.data);
        
        setState(prev => ({
          ...prev,
          overview: mockData.summary.overview || `Vous avez ${mockData.data.length} emails nécessitant une réponse aujourd'hui.`,
          emails: mockData.data,
          stats: {
            totalEmails: mockData.summary.totalEmails || mockData.data.length,
            highPriorityCount: mockData.summary.highPriorityCount || mockData.data.filter(e => e.analysis?.priority === 'high').length,
            actionRequiredCount: mockData.summary.actionRequiredCount || mockData.data.filter(e => e.analysis?.actionRequired).length,
            categoryCounts: mockData.summary.categoryCounts || {}
          },
          loading: false,
          refreshing: false
        }));
        return;
      }

      // --- API RÉELLE ---
      setState(prev => ({ ...prev, loading: true, error: null, refreshing: trulyForceRefresh }));

      const requestUrl = `${API_BASE_URL}/analyze-email/today/all/summary?fastMode=${fastMode}${trulyForceRefresh ? '&forceRefresh=true' : ''}`;
      
      console.log(`Tentative de connexion à: ${requestUrl}`);
      
      // unique API call
      const summaryApiResponse = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // En web, on ne peut pas utiliser credentials avec une origine différente
        // à moins que le serveur n'autorise spécifiquement cette origine
        mode: 'cors' as RequestMode,
        credentials: Platform.OS === 'web' ? 'same-origin' as RequestCredentials : 'include' as RequestCredentials
      });

      if (!summaryApiResponse.ok) {
        const errorText = await summaryApiResponse.text();
        setState(prev => ({
          ...prev,
          error: `Erreur API résumé: ${summaryApiResponse.status} ${summaryApiResponse.statusText}. Réponse: ${errorText}`,
          loading: false,
          refreshing: false
        }));
        throw new Error(`Erreur API résumé: ${summaryApiResponse.status} ${summaryApiResponse.statusText}. Réponse: ${errorText}`);
      }

      const responseData = await summaryApiResponse.json();
      const allAnalyzedEmailsFromApi: EmailData[] = responseData.data || [];

      if (responseData.status === 'success' && responseData.summary && responseData.data) {
        const apiSummary = responseData.summary;
        // allAnalyzedEmailsFromApi est déjà initialisé avec responseData.data

        // Filtrer ici les emails nécessitant une action pour l'affichage
        const emailsRequiringAction = allAnalyzedEmailsFromApi.filter(
          email => email.analysis?.actionRequired
        );
        
        // Mettre à jour le store avec les emails filtrés si c'est sa responsabilité
        useMailsStore.getState().setActionRequiredEmails(emailsRequiringAction);

        setState(prev => ({
          ...prev,
          overview: apiSummary.overview,
          emails: emailsRequiringAction, // Afficher la liste filtrée
          stats: { // Les stats peuvent rester basées sur le résumé global de tous les emails
            totalEmails: apiSummary.totalEmails,
            highPriorityCount: apiSummary.highPriorityCount,
            actionRequiredCount: apiSummary.actionRequiredCount, // Ceci vient du résumé, basé sur tous les emails
            categoryCounts: apiSummary.categoryCounts || {}
          },
          loading: false,
          refreshing: false
        }));
      } else {
        console.warn(`Résumé complet non obtenu de l'API (status!='success' ou summary/overview/data manquant). Réponse reçue:`, JSON.stringify(responseData));
        // Utiliser allAnalyzedEmailsFromApi qui contient responseData.data ou []
        const localStats = calculateStats(allAnalyzedEmailsFromApi);
        const localOverview = `Vous avez ${allAnalyzedEmailsFromApi.length} emails (résumé API détaillé non disponible).`;
        
        // Mettre à jour le store avec tous les emails si le résumé détaillé échoue mais que les données sont là
        useMailsStore.getState().setActionRequiredEmails(allAnalyzedEmailsFromApi.filter(e => e.analysis?.actionRequired));

        setState(prev => ({
          ...prev,
          overview: localOverview,
          emails: allAnalyzedEmailsFromApi.filter(e => e.analysis?.actionRequired), // Ou allAnalyzedEmailsFromApi si on veut tout afficher
          stats: localStats,
          loading: false,
          refreshing: false,
          error: responseData.message || 'Impossible de traiter la réponse du résumé.'
        }));
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
  }, [actionRequiredEmails, shouldRefetch, API_BASE_URL]);

  // Mise à jour de onRefresh pour utiliser les derniers paramètres
  const onRefresh = useCallback(() => {
    setState(prev => ({ ...prev, refreshing: true }));
    const { fastMode } = paramsRef.current;
    fetchMailSummary(fastMode, true);
  }, [fetchMailSummary]);

  // Nouvelle fonction pour récupérer les emails par plage de dates
  const fetchMailsByDateRange = useCallback(async (
    startDate: string,
    endDate: string,
    options: {
      unseenOnly?: boolean;
      limit?: number;
      fastMode?: boolean;
      forceRefresh?: boolean;
    } = {}
  ) => {
    try {
      // S'assurer que forceRefresh est un booléen, même si mal appelé
      const trulyForceRefresh = typeof options.forceRefresh === 'boolean' ? options.forceRefresh : false;
      const fastMode = typeof options.fastMode === 'boolean' ? options.fastMode : false;
      const unseenOnly = typeof options.unseenOnly === 'boolean' ? options.unseenOnly : false;
      const limit = options.limit && options.limit > 0 ? options.limit : undefined;

      paramsRef.current = { fastMode, forceRefresh: trulyForceRefresh };
      const useMockData = getDataMode();

      setState(prev => ({ ...prev, loading: true, error: null, refreshing: trulyForceRefresh }));

      if (useMockData) {
        console.log('[MOCK] Utilisation des données mock pour le filtrage par date');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const store = useMailsStore.getState();
        store.setActionRequiredEmails(mockData.data);
        
        setState(prev => ({
          ...prev,
          overview: mockData.summary.overview || `Vous avez ${mockData.data.length} emails pour la période sélectionnée.`,
          emails: mockData.data,
          stats: {
            totalEmails: mockData.summary.totalEmails || mockData.data.length,
            highPriorityCount: mockData.summary.highPriorityCount || mockData.data.filter(e => e.analysis?.priority === 'high').length,
            actionRequiredCount: mockData.summary.actionRequiredCount || mockData.data.filter(e => e.analysis?.actionRequired).length,
            categoryCounts: mockData.summary.categoryCounts || {}
          },
          loading: false,
          refreshing: false
        }));
        return;
      }

      // --- API RÉELLE ---
      // Construire l'URL avec les paramètres
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      params.append('unseenOnly', unseenOnly.toString());
      params.append('summary', 'true'); // Toujours demander le résumé
      params.append('fastMode', fastMode.toString());
      if (limit) params.append('limit', limit.toString());
      
      const requestUrl = `${API_BASE_URL}/analyze-email/date-range?${params.toString()}`;
      
      console.log(`Tentative de connexion à: ${requestUrl}`);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: Platform.OS === 'web' ? 'same-origin' : 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        setState(prev => ({
          ...prev,
          error: `Erreur API plage de dates: ${response.status} ${response.statusText}. Réponse: ${errorText}`,
          loading: false,
          refreshing: false
        }));
        throw new Error(`Erreur API plage de dates: ${response.status} ${response.statusText}. Réponse: ${errorText}`);
      }

      const responseData = await response.json();
      const allAnalyzedEmailsFromApi: EmailData[] = responseData.data || [];

      if (responseData.status === 'success' && responseData.summary && responseData.data) {
        const apiSummary = responseData.summary;
        
        // Filtrer les emails nécessitant une action pour l'affichage
        const emailsRequiringAction = allAnalyzedEmailsFromApi.filter(
          email => email.analysis?.actionRequired
        );
        
        // Mettre à jour le store avec les emails filtrés
        useMailsStore.getState().setActionRequiredEmails(emailsRequiringAction);

        setState(prev => ({
          ...prev,
          overview: apiSummary.overview,
          emails: emailsRequiringAction,
          stats: {
            totalEmails: apiSummary.totalEmails,
            highPriorityCount: apiSummary.highPriorityCount,
            actionRequiredCount: apiSummary.actionRequiredCount,
            categoryCounts: apiSummary.categoryCounts || {}
          },
          loading: false,
          refreshing: false
        }));
      } else {
        console.warn(`Résumé complet non obtenu de l'API (status!='success' ou summary/overview/data manquant). Réponse reçue:`, JSON.stringify(responseData));
        const localStats = calculateStats(allAnalyzedEmailsFromApi);
        const localOverview = `Vous avez ${allAnalyzedEmailsFromApi.length} emails pour la période sélectionnée.`;
        
        useMailsStore.getState().setActionRequiredEmails(allAnalyzedEmailsFromApi.filter(e => e.analysis?.actionRequired));

        setState(prev => ({
          ...prev,
          overview: localOverview,
          emails: allAnalyzedEmailsFromApi.filter(e => e.analysis?.actionRequired),
          stats: localStats,
          loading: false,
          refreshing: false,
          error: responseData.message || 'Impossible de traiter la réponse du résumé.'
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        refreshing: false
      }));
      console.error('Erreur lors de la récupération des emails par date:', err);
    }
  }, [API_BASE_URL]);

  return {
    ...state,
    fetchMailSummary,
    fetchMailsByDateRange,
    onRefresh
  };
};

export default useMailSummary; 