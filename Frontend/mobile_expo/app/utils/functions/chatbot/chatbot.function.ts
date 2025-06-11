import { Platform } from 'react-native';
import url from '../../url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Interface pour la requête de chat via l'API Gateway
interface ChatRequest {
  message: string;
  conversationId?: string;
  database?: string;
  userId?: string;
}

// Interface pour la réponse du chatbot via l'API Gateway
export interface ChatbotResponse {
  response: string;
  conversationId: string;
  database: string;
  timestamp: string;
  analysis?: any;
  query_executed?: string;
  query_description?: string;
  data?: unknown;
  response_format?: string;
}

// Interface pour les messages de conversation
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// Interface pour l'historique de conversation
export interface ConversationHistory {
  conversationId: string;
  database: string;
  messages: ConversationMessage[];
}

// Clés pour le stockage local
const USER_ID_STORAGE_KEY = 'chatbot_user_id';
const CONVERSATION_ID_STORAGE_KEY = 'chatbot_conversation_id';

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

// Fonction pour obtenir ou créer un ID de conversation
export const getConversationId = async (): Promise<string> => {
  try {
    let conversationId = await AsyncStorage.getItem(CONVERSATION_ID_STORAGE_KEY);
    
    if (!conversationId) {
      conversationId = uuidv4();
      await AsyncStorage.setItem(CONVERSATION_ID_STORAGE_KEY, conversationId);
    }
    
    return conversationId;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID de conversation:', error);
    return uuidv4();
  }
};

// Fonction pour créer une nouvelle conversation
export const createNewConversation = async (): Promise<string> => {
  try {
    const newConversationId = uuidv4();
    await AsyncStorage.setItem(CONVERSATION_ID_STORAGE_KEY, newConversationId);
    return newConversationId;
  } catch (error) {
    console.error('Erreur lors de la création d\'une nouvelle conversation:', error);
    return uuidv4();
  }
};

// Fonction pour vérifier l'état de santé du service chatbot via l'API Gateway
export const checkChatbotHealth = async (): Promise<{ status: string; gateway: string; message: string }> => {
  try {
    console.log('🔍 Vérification de santé via ngrok -> localhost:3000...');
    const response = await fetch(`${url.local}chatbot/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Service chatbot accessible via ngrok -> API Gateway');
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la santé du chatbot:', error);
    throw new Error('Le service chatbot est indisponible via ngrok -> API Gateway');
  }
};

// Fonction pour envoyer un message au chatbot via l'API Gateway
export const sendConversationMessage = async (message: string, database?: string): Promise<ChatbotResponse> => {
  try {
    console.log(`💬 Envoi du message via ngrok -> API Gateway: "${message.substring(0, 50)}..."`);
    
    const userId = await getUserId();
    const conversationId = await getConversationId();
    
    const chatRequest: ChatRequest = {
      message,
      conversationId,
      database: database || 'sync', // Base par défaut
      userId,
    };

    const response = await fetch(`${url.local}chatbot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur du serveur' }));
      console.error('❌ Erreur lors de l\'envoi du message:', errorData);
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Message traité avec succès via ngrok -> API Gateway');
    return result;
  } catch (error: unknown) {
    console.error('❌ Erreur lors de l\'envoi du message de conversation:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Impossible de communiquer avec le service chatbot via ngrok -> API Gateway');
  }
};

// Fonction pour récupérer l'historique d'une conversation
export const getConversationHistory = async (conversationId?: string): Promise<ConversationHistory> => {
  try {
    const currentConversationId = conversationId || await getConversationId();
    console.log(`📜 Récupération de l'historique via ngrok -> API Gateway: ${currentConversationId}`);
    
    const response = await fetch(`${url.local}chatbot/conversation/${currentConversationId}/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Conversation non trouvée');
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Historique récupéré avec succès');
    return result;
  } catch (error: unknown) {
    console.error('❌ Erreur lors de la récupération de l\'historique:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Impossible de récupérer l\'historique de la conversation');
  }
};

// Fonction pour supprimer une conversation
export const clearConversation = async (conversationId?: string): Promise<{ success: boolean; message: string }> => {
  try {
    const currentConversationId = conversationId || await getConversationId();
    console.log(`🗑️ Suppression de la conversation via ngrok -> API Gateway: ${currentConversationId}`);
    
    const response = await fetch(`${url.local}chatbot/conversation/${currentConversationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    
    // Créer une nouvelle conversation après suppression
    await createNewConversation();
    
    console.log('✅ Conversation supprimée avec succès');
    return result;
  } catch (error: unknown) {
    console.error('❌ Erreur lors de la suppression de la conversation:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Impossible de supprimer la conversation');
  }
};

// Fonction pour vérifier le statut des bases de données
export const getDatabaseStatus = async (): Promise<any> => {
  try {
    console.log('🗄️ Vérification du statut des bases de données via ngrok -> API Gateway');
    
    const response = await fetch(`${url.local}chatbot/databases/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Statut des bases de données récupéré');
    return result;
  } catch (error: unknown) {
    console.error('❌ Erreur lors de la vérification du statut des bases de données:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Impossible de vérifier le statut des bases de données');
  }
};

// Fonction pour obtenir les informations sur l'API Gateway
export const getGatewayInfo = async (): Promise<any> => {
  try {
    const response = await fetch(`${url.local}chatbot/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error: unknown) {
    console.error('Erreur lors de la récupération des informations de l\'API Gateway:', error);
    throw new Error('Impossible de récupérer les informations de l\'API Gateway');
  }
};

// Fonction pour formater la réponse du chatbot
export const formatChatbotResponse = (response: ChatbotResponse): string => {
  // Priorité 1: Utiliser le champ response s'il existe
  if (response.response) {
    return response.response;
  }
  
  // Priorité 2: Utiliser les données si disponibles
  if (response.data) {
    if (typeof response.data === 'object') {
      try {
        const replacer = (key: string, value: any) => {
          if (value === undefined || value === null) {
            return 'Non spécifié';
          }
          
          if (value instanceof Date) {
            return value.toISOString();
          }
          
          if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
              return value.map(item => {
                if (typeof item === 'object' && item !== null) {
                  if ('id' in item && ('name' in item || 'firstname' in item)) {
                    const name = 'name' in item ? item.name : 
                                 ('firstname' in item && 'lastname' in item) ? 
                                 `${item.firstname || ''} ${item.lastname || ''}`.trim() : 'Sans nom';
                    return `#${item.id} ${name}`;
                  }
                }
                return item;
              });
            }
            
            if ('id' in value) {
              if ('name' in value) {
                return `${value.name || 'Sans nom'} (ID: ${value.id})`;
              } else if ('firstname' in value && 'lastname' in value) {
                return `${value.firstname || ''} ${value.lastname || ''}`.trim() + ` (ID: ${value.id})`;
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

// Fonction utilitaire pour changer de base de données
export const switchDatabase = async (database: 'sync' | 'app'): Promise<void> => {
  try {
    // Créer une nouvelle conversation lors du changement de base
    await createNewConversation();
    console.log(`🔄 Changement vers la base de données: ${database}`);
  } catch (error) {
    console.error('Erreur lors du changement de base de données:', error);
  }
};
