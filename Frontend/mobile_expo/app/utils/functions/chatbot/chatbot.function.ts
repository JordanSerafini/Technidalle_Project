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
      try {
        // Fonction récursive pour transformer [object Object] en valeurs plus lisibles
        const replacer = (key: string, value: any) => {
          // Gérer les objets spéciaux comme les dates
          if (value instanceof Date) {
            return value.toISOString();
          }
          
          // Pour les objets imbriqués sans toString personnalisé
          if (typeof value === 'object' && value !== null) {
            // Si c'est un tableau d'objets, formater chaque élément
            if (Array.isArray(value)) {
              return value.map(item => {
                if (typeof item === 'object' && item !== null) {
                  // Pour les objets dans les tableaux, on extrait les propriétés importantes
                  if ('id' in item && ('name' in item || 'firstname' in item)) {
                    // Format simplifié pour les objets avec ID et nom
                    const name = 'name' in item ? item.name : 
                                 ('firstname' in item && 'lastname' in item) ? 
                                 `${item.firstname} ${item.lastname}` : 'Sans nom';
                    return `#${item.id} ${name}`;
                  }
                }
                return item;
              });
            }
            
            // Si c'est un objet avec des propriétés importantes, on les met en avant
            if ('id' in value) {
              if ('name' in value) {
                return `${value.name} (ID: ${value.id})`;
              } else if ('firstname' in value && 'lastname' in value) {
                return `${value.firstname} ${value.lastname} (ID: ${value.id})`;
              }
            }
          }
          return value;
        };
        
        return JSON.stringify(response.data, replacer, 2);
      } catch (error) {
        console.error('Erreur lors du formatage des données:', error);
        return JSON.stringify(response.data, null, 2);
      }
    }
    return String(response.data);
  }
  
  return "Désolé, je n'ai pas trouvé de réponse à votre question.";
};
