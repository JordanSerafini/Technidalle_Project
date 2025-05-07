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
      paramsRef.current = { fastMode, responseLength, forceRefresh };
      const useMockData = getDataMode();

      if (useMockData) {
        console.log('[MOCK] Utilisation des données mock pour tout');
        setState(prev => ({ ...prev, loading: true, error: null }));
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
      setState(prev => ({ ...prev, loading: true, error: null, refreshing: forceRefresh }));

      // 1. Récupérer les emails nécessitant une réponse
      console.log('[API] Étape 1: Récupération des emails nécessitant une réponse');
      const emailsData = await fetchEmailsRequiringResponse(fastMode, forceRefresh);

      if (!emailsData) { // Peut être null ou undefined si fetchEmailsRequiringResponse a un souci avant de retourner []
        setState(prev => ({
          ...prev,
          error: "Aucun email n'a pu être récupéré (fetchEmailsRequiringResponse a échoué)",
          emails: [],
          stats: null,
          overview: '',
          loading: false,
          refreshing: false
        }));
        return;
      }

      // 2. Récupérer le résumé complet (overview, stats détaillées)
      console.log('[API] Étape 2: Récupération du résumé complet depuis l\'API');
      try {
        const fetchOptionsForSummary = {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            // 'Content-Type': 'application/json', // Pas nécessaire pour un GET simple
            'Origin': Platform.OS === 'web' ? 'http://localhost:8081' : 'http://localhost' // Ajustez si votre origine est différente
          },
          mode: 'cors' as RequestMode,
          credentials: 'include' as RequestCredentials // Si votre API utilise des cookies/sessions
        };

        const summaryApiResponse = await fetch(
          `${API_BASE_URL}/analyze-email/today/all/summary?fastMode=${fastMode}&responseLength=${responseLength}`,
          fetchOptionsForSummary
        );
        const summaryResponseData = await summaryApiResponse.json();

        if (summaryResponseData.status === 'success' && summaryResponseData.summary && summaryResponseData.summary.overview) {
          const apiSummary = summaryResponseData.summary;
          setState(prev => ({
            ...prev,
            overview: apiSummary.overview || `Vous avez ${emailsData.length} emails. Résumé non fourni par l'API.`,
            emails: emailsData,
            stats: {
              totalEmails: apiSummary.totalEmails || emailsData.length,
              highPriorityCount: apiSummary.highPriorityCount || emailsData.filter(e => e.analysis?.priority === 'high').length,
              actionRequiredCount: apiSummary.actionRequiredCount || emailsData.filter(e => e.analysis?.actionRequired).length,
              categoryCounts: apiSummary.categoryCounts || {}
            },
            loading: false,
            refreshing: false
          }));
          console.log('Emails et résumé complet récupérés depuis l\'API');
        } else {
          // Le résumé n'a pas pu être chargé, utiliser un résumé local basé sur les emails
          console.warn('Résumé complet non obtenu de l\'API, utilisation d\'un résumé local.', summaryResponseData.message);
          const localStats = calculateStats(emailsData);
          const localOverview = `Vous avez ${emailsData.length} emails nécessitant une réponse aujourd'hui (résumé API indisponible).`;
          setState(prev => ({
            ...prev,
            overview: localOverview,
            emails: emailsData,
            stats: localStats,
            loading: false,
            refreshing: false
          }));
        }
      } catch (summaryError) {
        console.error('Erreur lors de la récupération du résumé complet:', summaryError);
        // Erreur lors du fetch du résumé, utiliser un résumé local basé sur les emails déjà récupérés
        const localStats = calculateStats(emailsData);
        const localOverview = `Vous avez ${emailsData.length} emails nécessitant une réponse aujourd'hui (erreur résumé API).`;
        setState(prev => ({
          ...prev,
          overview: localOverview,
          emails: emailsData, // On a quand même les emails
          stats: localStats,
          loading: false,
          refreshing: false,
          error: prev.error // Conserver une erreur précédente si elle existe, ou la nouvelle
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