import { create } from 'zustand';
import { EmailData, ResponseLength } from '../utils/types/mailTypes';

// Interface pour les données de brouillon et de réponses
interface DraftResponseData {
  originalEmail: EmailData | null;
  draftResponse: string;
}

interface MailsStoreState {
  // Données
  actionRequiredEmails: EmailData[];
  lastFetchTime: number | null;
  
  // Cache des brouillons
  draftResponses: { [emailId: string]: { 
    data: DraftResponseData, 
    timestamp: number,
    responseLength: ResponseLength 
  } };
  
  // Cache des réponses reformulées
  rewrittenResponses: { [key: string]: { 
    response: string, 
    timestamp: number 
  } };
  
  // Indicateurs de chargement
  isLoading: boolean;
  
  // Actions pour les emails
  setActionRequiredEmails: (emails: EmailData[]) => void;
  setIsLoading: (loading: boolean) => void;
  clearStore: () => void;
  
  // Actions pour les brouillons
  setDraftResponse: (
    emailId: string, 
    data: DraftResponseData, 
    responseLength: ResponseLength
  ) => void;
  getDraftResponse: (
    emailId: string, 
    responseLength: ResponseLength
  ) => DraftResponseData | null;
  
  // Actions pour les réponses reformulées
  setRewrittenResponse: (
    emailId: string, 
    draftResponse: string, 
    instructions: string, 
    rewrittenResponse: string
  ) => void;
  getRewrittenResponse: (
    emailId: string, 
    draftResponse: string, 
    instructions: string
  ) => string | null;
  
  // Utilitaires
  getTimeSinceLastFetch: () => number; // en secondes
  shouldRefetch: (maxAge?: number) => boolean; // maxAge en secondes
  shouldRefetchDraft: (emailId: string, responseLength: ResponseLength, maxAge?: number) => boolean;
}

// Création du store
export const useMailsStore = create<MailsStoreState>((set, get) => ({
  // État initial
  actionRequiredEmails: [],
  lastFetchTime: null,
  draftResponses: {},
  rewrittenResponses: {},
  isLoading: false,
  
  // Actions pour les emails
  setActionRequiredEmails: (emails) => set({ 
    actionRequiredEmails: emails,
    lastFetchTime: Date.now()
  }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  clearStore: () => set({
    actionRequiredEmails: [],
    lastFetchTime: null,
    draftResponses: {},
    rewrittenResponses: {}
  }),
  
  // Actions pour les brouillons
  setDraftResponse: (emailId, data, responseLength) => set(state => ({
    draftResponses: {
      ...state.draftResponses,
      [emailId + '_' + responseLength]: {
        data,
        timestamp: Date.now(),
        responseLength
      }
    }
  })),
  
  getDraftResponse: (emailId, responseLength) => {
    const { draftResponses } = get();
    const cacheKey = emailId + '_' + responseLength;
    return draftResponses[cacheKey]?.data || null;
  },
  
  // Actions pour les réponses reformulées
  setRewrittenResponse: (emailId, draftResponse, instructions, rewrittenResponse) => set(state => {
    // Créer une clé unique basée sur tous les paramètres qui pourraient affecter la réponse
    const cacheKey = `${emailId}_${draftResponse.length}_${instructions}`;
    return {
      rewrittenResponses: {
        ...state.rewrittenResponses,
        [cacheKey]: {
          response: rewrittenResponse,
          timestamp: Date.now()
        }
      }
    };
  }),
  
  getRewrittenResponse: (emailId, draftResponse, instructions) => {
    const { rewrittenResponses } = get();
    const cacheKey = `${emailId}_${draftResponse.length}_${instructions}`;
    return rewrittenResponses[cacheKey]?.response || null;
  },
  
  // Utilitaires
  getTimeSinceLastFetch: () => {
    const { lastFetchTime } = get();
    if (!lastFetchTime) return Infinity;
    return (Date.now() - lastFetchTime) / 1000; // en secondes
  },
  
  // Vérifie si les données doivent être rechargées
  // Par défaut, considère que les données sont périmées après 5 minutes
  shouldRefetch: (maxAge = 300) => {
    const timeSinceLastFetch = get().getTimeSinceLastFetch();
    return timeSinceLastFetch > maxAge;
  },
  
  // Vérifie si un brouillon doit être regénéré
  shouldRefetchDraft: (emailId, responseLength, maxAge = 600) => {
    const { draftResponses } = get();
    const cacheKey = emailId + '_' + responseLength;
    const draft = draftResponses[cacheKey];
    
    if (!draft) return true;
    
    const timeSinceLastFetch = (Date.now() - draft.timestamp) / 1000;
    return timeSinceLastFetch > maxAge;
  }
}));

export default useMailsStore; 