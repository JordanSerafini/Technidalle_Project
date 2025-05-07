import { Alert, Platform } from "react-native";
import { EmailData, ResponseLength } from "../types/mailTypes";

// Définir l'URL de l'API correctement en fonction de la plateforme
const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:4444' 
  : 'http://10.0.2.2:4444'; // Pour les émulateurs Android

/**
 * Récupère la liste des emails nécessitant une réponse
 */
export const fetchEmailsRequiringResponse = async (fastMode: boolean = false): Promise<EmailData[]> => {
  try {
    const apiResponse = await fetch(`${API_URL}/analyze-email/today?fastMode=${fastMode}`);
    const data = await apiResponse.json();
    
    if (data.status === 'success') {
      return data.data;
    } else {
      Alert.alert('Erreur', data.message);
      return [];
    }
  } catch (err) {
    console.error('Erreur lors du chargement des emails:', err);
    Alert.alert('Erreur', 'Impossible de charger les emails');
    return [];
  }
};

/**
 * Génère un brouillon de réponse pour un email
 */
export const fetchDraftResponse = async (
  emailId: string, 
  responseLength: ResponseLength = 'normal'
): Promise<{
  originalEmail: EmailData | null;
  draftResponse: string;
}> => {
  try {
    const apiResponse = await fetch(`${API_URL}/send-email/draft-response/${emailId}?responseLength=${responseLength}`);
    const data = await apiResponse.json();
    
    if (data.status === 'success') {
      return {
        originalEmail: data.data.originalEmail,
        draftResponse: data.data.draftResponse
      };
    } else {
      Alert.alert('Erreur', data.message);
      return { originalEmail: null, draftResponse: '' };
    }
  } catch (err) {
    console.error('Erreur lors de la génération du brouillon:', err);
    Alert.alert('Erreur', 'Impossible de générer le brouillon');
    return { originalEmail: null, draftResponse: '' };
  }
};

/**
 * Reformule une réponse avec des instructions
 */
export const fetchRewrittenResponse = async (
  emailId: string,
  draftResponse: string,
  instructions: string,
  responseLength: ResponseLength = 'normal'
): Promise<string> => {
  try {
    const requestBody = {
      draftResponse,
      instructions,
      responseLength
    };
    
    const apiResponse = await fetch(`${API_URL}/send-email/rewrite-response/${emailId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    const data = await apiResponse.json();

    if (data.status === 'success') {
      return data.data.rewrittenResponse;
    } else {
      Alert.alert('Erreur', data.message);
      return draftResponse;
    }
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
    const apiResponse = await fetch(`${API_URL}/send-email/send-response/${emailId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        responseText,
        customSubject
      })
    });
    const data = await apiResponse.json();

    if (data.status === 'success') {
      Alert.alert('Succès', 'Email envoyé avec succès');
      return true;
    } else {
      Alert.alert('Erreur', data.message);
      return false;
    }
  } catch (err) {
    console.error('Erreur lors de l\'envoi:', err);
    Alert.alert('Erreur', 'Impossible d\'envoyer l\'email');
    return false;
  }
};

/**
 * Réponse automatique à un email
 */
export const sendAutoResponse = async (
  emailId: string,
  responseLength: ResponseLength = 'normal',
  customInstructions?: string,
  customSubject?: string
): Promise<boolean> => {
  try {
    const requestBody: any = {
      responseLength
    };
    
    if (customInstructions?.trim()) {
      requestBody.customInstructions = customInstructions;
    }
    
    if (customSubject) {
      requestBody.customSubject = customSubject;
    }
    
    const apiResponse = await fetch(`${API_URL}/send-email/auto-respond/${emailId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    const data = await apiResponse.json();

    if (data.status === 'success') {
      Alert.alert('Succès', 'Réponse automatique envoyée avec succès');
      return true;
    } else {
      Alert.alert('Erreur', data.message);
      return false;
    }
  } catch (err) {
    console.error('Erreur lors de la réponse automatique:', err);
    Alert.alert('Erreur', 'Impossible d\'envoyer la réponse automatique');
    return false;
  }
};

// Export un objet contenant toutes les fonctions
const mailFunctions = {
  fetchEmailsRequiringResponse,
  fetchDraftResponse,
  fetchRewrittenResponse,
  sendEmailResponse,
  sendAutoResponse
};

export default mailFunctions;

