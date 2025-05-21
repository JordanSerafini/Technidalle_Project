import { Platform } from 'react-native';
import url from '../../url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Interface pour la requête du chatbot standard
interface ChatbotRequest {
  question: string;
}

// Interface pour la requête de conversation
interface ConversationRequest {
  userId: string;
  message: string;
}

// Interface pour la réponse du chatbot
export interface ChatbotResponse {
  analysis?: any;
  message?: string;
  query_executed?: string;
  query_description?: string;
  data?: unknown;
  response_format?: string;
  response?: string;
}

// Clé pour le stockage de l'ID utilisateur
const USER_ID_STORAGE_KEY = 'chatbot_user_id';

// Fonction pour obtenir ou créer un ID utilisateur unique
export const getUserId = async (): Promise<string> => {
  try {
    let userId = await AsyncStorage.getItem(USER_ID_STORAGE_KEY);
    
    if (!userId) {
      userId = uuidv4();
      await AsyncStorage.setItem(USER_ID_STORAGE_KEY, userId);
    }
    
    return userId;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
    return uuidv4(); // En cas d'erreur, générer un nouvel ID temporaire
  }
};

// Fonction pour vérifier l'état de santé de l'API du chatbot
export const checkChatbotHealth = async (): Promise<{ status: string }> => {
  try {
    const response = await fetch(`${url.chatbot}chatbot/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la vérification de la santé du chatbot:', error);
    throw new Error('Le service chatbot est indisponible');
  }
};

// Fonction pour envoyer une question au chatbot (sans contexte de conversation)
export const sendMessageToChatbot = async (message: string): Promise<ChatbotResponse> => {
  try {
    const chatbotRequest: ChatbotRequest = {
      question: message,
    };

    const response = await fetch(`${url.chatbot}analyze/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatbotRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur du serveur' }));
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error: unknown) {
    console.error('Erreur lors de l\'envoi du message au chatbot:', error);
    
    // Gérer l'erreur
    if (error instanceof Error) {
      throw error;
    }
    
    // Erreur par défaut
    throw new Error('Impossible de communiquer avec le service chatbot');
  }
};

// Fonction pour envoyer un message dans le contexte d'une conversation
export const sendConversationMessage = async (message: string): Promise<ChatbotResponse> => {
  try {
    const userId = await getUserId();
    
    const conversationRequest: ConversationRequest = {
      userId,
      message,
    };

    const response = await fetch(`${url.chatbot}analyze/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversationRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur du serveur' }));
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error: unknown) {
    console.error('Erreur lors de l\'envoi du message de conversation:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Impossible de communiquer avec le service chatbot');
  }
};

// Fonction pour formater les données avant de les afficher si nécessaire
export const formatChatbotResponse = (response: ChatbotResponse): string => {
  // Priorité 1: Utiliser le champ response s'il existe
  if (response.response) {
    return response.response;
  }
  
  // Priorité 2: Utiliser le champ message s'il existe
  if (response.message) {
    return response.message;
  } 
  
  // Priorité 3: Utiliser les données si disponibles
  if (response.data) {
    // Si les données sont disponibles mais pas de message formaté, 
    // on peut créer un message générique ou formater les données
    if (typeof response.data === 'object') {
      return JSON.stringify(response.data, null, 2);
    }
    return String(response.data);
  }
  
  return "Désolé, je n'ai pas trouvé de réponse à votre question.";
};
