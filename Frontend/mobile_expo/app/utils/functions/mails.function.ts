import { Platform, Alert } from 'react-native';
import { EmailData, ResponseLength } from '../types/mailTypes';
// Import des données mock
import { dailyMailsMock as mockData } from '../data/dailyMails.mock';

// API URL
const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:4444' 
  : 'http://192.168.20.225:4444';

/**
 * Récupère la liste des emails nécessitant une réponse
 */
export const fetchEmailsRequiringResponse = async (fastMode: boolean = false): Promise<EmailData[]> => {
  try {
    // UTILISATION DES DONNÉES MOCK AU LIEU DU FETCH RÉEL
    console.log(`[DEV] Utilisation des données mock pour fetchEmailsRequiringResponse (fastMode: ${fastMode})`);
    
    // Simuler un délai pour imiter un appel réseau
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Filtrer les emails qui nécessitent une réponse (actionRequired: true)
    const actionRequiredEmails = mockData.data.filter(email => 
      email.analysis && email.analysis.actionRequired === true
    );
    
    return actionRequiredEmails;
    
    /*
    // Fetch original (commenté pendant le développement)
    const apiResponse = await fetch(`${API_URL}/analyze-email/today?fastMode=${fastMode}`);
    const data = await apiResponse.json();
    
    if (data.status === 'success') {
      return data.data;
    } else {
      Alert.alert('Erreur', data.message);
      return [];
    }
    */
  } catch (err) {
    console.error('Erreur lors du chargement des emails:', err);
    Alert.alert('Erreur', 'Impossible de charger les emails');
    return [];
  }
};

/**
 * Récupère un brouillon de réponse pour un email
 */
export const fetchDraftResponse = async (
  emailId: string, 
  responseLength: ResponseLength = 'normal'
): Promise<{
  originalEmail: EmailData | null;
  draftResponse: string;
}> => {
  try {
    // UTILISATION DES DONNÉES MOCK AU LIEU DU FETCH RÉEL
    console.log(`[DEV] Utilisation des données mock pour fetchDraftResponse (emailId: ${emailId}, responseLength: ${responseLength})`);
    
    // Simuler un délai pour imiter un appel réseau
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Trouver l'email original dans les données mock
    const originalEmail = mockData.data.find(email => email.id === emailId) || null;
    
    if (!originalEmail) {
      throw new Error(`Email avec l'ID ${emailId} non trouvé dans les données mockées`);
    }
    
    // Générer un brouillon de réponse simulé
    let draftResponse = '';
    
    const fromName = originalEmail.from.match(/"([^"]+)"/) 
      ? originalEmail.from.match(/"([^"]+)"/)![1] 
      : originalEmail.from.split('<')[0].trim();
      
    switch (responseLength) {
      case 'court':
        draftResponse = `Bonjour ${fromName},\n\nMerci pour votre message. J'ai bien pris note de votre demande.\n\nCordialement,\nJordan`;
        break;
      case 'détaillé':
        draftResponse = `Bonjour ${fromName},\n\nJe vous remercie pour votre message concernant "${originalEmail.subject}".\n\nJ'ai bien pris note de tous les éléments que vous avez partagés. Après analyse, je souhaite vous informer que nous allons traiter cette demande avec la plus grande attention.\n\nÀ propos des points que vous avez soulevés:\n1. Nous avons bien compris votre préoccupation principale\n2. Les actions suggérées seront mises en œuvre prochainement\n3. Un suivi sera effectué dans les meilleurs délais\n\nN'hésitez pas à me contacter si vous avez besoin d'informations supplémentaires.\n\nCordialement,\nJordan Serafini`;
        break;
      default: // 'normal'
        draftResponse = `Bonjour ${fromName},\n\nMerci pour votre message concernant "${originalEmail.subject}".\n\nJ'ai bien pris note de votre demande et je m'en occupe dans les plus brefs délais. Soyez assuré(e) que nous apportons à ce sujet toute l'attention qu'il mérite.\n\nCordialement,\nJordan`;
    }
    
    return {
      originalEmail,
      draftResponse
    };
    
    /*
    // Fetch original (commenté pendant le développement)
    const apiResponse = await fetch(`${API_URL}/email/draft-response/${emailId}?responseLength=${responseLength}`);
    const data = await apiResponse.json();
    
    if (data.status === 'success') {
      return {
        originalEmail: data.originalEmail || null,
        draftResponse: data.draftResponse || ''
      };
    } else {
      Alert.alert('Erreur', data.message);
      return {
        originalEmail: null,
        draftResponse: ''
      };
    }
    */
  } catch (err) {
    console.error('Erreur lors de la génération du brouillon:', err);
    Alert.alert('Erreur', 'Impossible de générer un brouillon de réponse');
    return {
      originalEmail: null,
      draftResponse: ''
    };
  }
};

/**
 * Récupère une réponse reformulée
 */
export const fetchRewrittenResponse = async (
  emailId: string,
  draftResponse: string,
  instructions: string,
  responseLength: ResponseLength = 'normal'
): Promise<string> => {
  try {
    // UTILISATION DES DONNÉES MOCK AU LIEU DU FETCH RÉEL
    console.log(`[DEV] Utilisation des données mock pour fetchRewrittenResponse (emailId: ${emailId}, instructions: ${instructions})`);
    
    // Simuler un délai pour imiter un appel réseau
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Trouver l'email dans les données mock
    const email = mockData.data.find(email => email.id === emailId);
    
    if (!email) {
      throw new Error(`Email avec l'ID ${emailId} non trouvé dans les données mockées`);
    }
    
    // Simuler une reformulation basée sur les instructions
    let rewrittenResponse = draftResponse;
    
    if (instructions.toLowerCase().includes('formel')) {
      rewrittenResponse = rewrittenResponse.replace('Bonjour', 'Madame, Monsieur,');
      rewrittenResponse = rewrittenResponse.replace('Merci pour', 'Je vous remercie pour');
      rewrittenResponse = rewrittenResponse.replace('Cordialement', 'Je vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées');
    } else if (instructions.toLowerCase().includes('amical') || instructions.toLowerCase().includes('chaleureux')) {
      rewrittenResponse = rewrittenResponse.replace('Bonjour', 'Salut');
      rewrittenResponse = rewrittenResponse.replace('Cordialement', 'Bien à toi');
    } else if (instructions.toLowerCase().includes('concis') || instructions.toLowerCase().includes('court')) {
      rewrittenResponse = `Bonjour,\n\nMerci pour votre message. J'ai pris note de votre demande et vous répondrai dans les plus brefs délais.\n\nCordialement,\nJordan`;
    }
    
    return rewrittenResponse;
    
    /*
    // Fetch original (commenté pendant le développement)
    const apiResponse = await fetch(`${API_URL}/email/rewrite-response/${emailId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        draftResponse,
        instructions,
        responseLength
      })
    });
    
    const data = await apiResponse.json();
    
    if (data.status === 'success') {
      return data.rewrittenResponse || draftResponse;
    } else {
      Alert.alert('Erreur', data.message);
      return draftResponse;
    }
    */
  } catch (err) {
    console.error('Erreur lors de la reformulation:', err);
    Alert.alert('Erreur', 'Impossible de reformuler la réponse');
    return draftResponse;
  }
};

/**
 * Envoie une réponse à un email
 */
export const sendEmailResponse = async (
  emailId: string,
  responseText: string,
  customSubject?: string
): Promise<boolean> => {
  try {
    // UTILISATION DES DONNÉES MOCK AU LIEU DU FETCH RÉEL
    console.log(`[DEV] Simulation d'envoi de réponse (emailId: ${emailId})`);
    
    // Simuler un délai pour imiter un appel réseau
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Simuler une réponse réussie
    Alert.alert('Succès', 'Votre réponse a été envoyée avec succès (simulation)');
    return true;
    
    /*
    // Fetch original (commenté pendant le développement)
    const apiResponse = await fetch(`${API_URL}/email/send-response/${emailId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        responseText,
        customSubject
      })
    });
    
    const data = await apiResponse.json();
    
    if (data.status === 'success') {
      Alert.alert('Succès', 'Votre réponse a été envoyée avec succès');
      return true;
    } else {
      Alert.alert('Erreur', data.message);
      return false;
    }
    */
  } catch (err) {
    console.error('Erreur lors de l\'envoi de la réponse:', err);
    Alert.alert('Erreur', 'Impossible d\'envoyer la réponse');
    return false;
  }
};

/**
 * Envoie une réponse automatique à un email
 */
export const sendAutoResponse = async (
  emailId: string,
  responseLength: ResponseLength = 'normal',
  customInstructions?: string,
  customSubject?: string
): Promise<boolean> => {
  try {
    // UTILISATION DES DONNÉES MOCK AU LIEU DU FETCH RÉEL
    console.log(`[DEV] Simulation d'envoi de réponse automatique (emailId: ${emailId}, responseLength: ${responseLength})`);
    
    // Simuler un délai pour imiter un appel réseau
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    // Simuler une réponse réussie
    Alert.alert('Succès', 'Votre réponse automatique a été envoyée avec succès (simulation)');
    return true;
    
    /*
    // Fetch original (commenté pendant le développement)
    const apiResponse = await fetch(`${API_URL}/email/auto-response/${emailId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        responseLength,
        customInstructions,
        customSubject
      })
    });
    
    const data = await apiResponse.json();
    
    if (data.status === 'success') {
      Alert.alert('Succès', 'Votre réponse automatique a été envoyée avec succès');
      return true;
    } else {
      Alert.alert('Erreur', data.message);
      return false;
    }
    */
  } catch (err) {
    console.error('Erreur lors de l\'envoi de la réponse automatique:', err);
    Alert.alert('Erreur', 'Impossible d\'envoyer la réponse automatique');
    return false;
  }
};

// Exporter toutes les fonctions dans un objet
export default {
  fetchEmailsRequiringResponse,
  fetchDraftResponse,
  fetchRewrittenResponse,
  sendEmailResponse,
  sendAutoResponse
};

