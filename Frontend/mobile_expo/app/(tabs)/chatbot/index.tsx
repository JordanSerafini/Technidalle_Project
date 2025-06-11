import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Alert, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ChatMessage from '@/app/components/chatbot/ChatMessage';
import { Message, Attachment } from '@/app/components/chatbot/types';
import QuickReply from '@/app/components/chatbot/QuickReply';
import AttachmentButton from '@/app/components/chatbot/AttachmentButton';
import SpeechButton from '@/app/components/chatbot/SpeechButton';
import { 
  sendConversationMessage, 
  formatChatbotResponse, 
  checkChatbotHealth,
  getGatewayInfo,
  getDatabaseStatus,
  clearConversation,
  switchDatabase
} from '@/app/utils/functions/chatbot/chatbot.function';
import DataCards from '@/app/components/chatbot/DataCards';

// Suggestions de démarrage pour la conversation
const INITIAL_SUGGESTIONS = [
  "Quels sont les chantiers de cette année ?",
  "Quels clients n'ont jamais payé une facture ?",
  "Quel sont les projets les plus rentables ?",
  "Personnel disponible demain",
  "Quels sont les prochains événements ?",
  "Quelle est la timeline des projets en cours ?",
  "Quel est le planning de travail du mois ?",
];

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Bonjour ! Je suis TechniAssistant via l\'API Gateway. Comment puis-je vous aider aujourd\'hui ?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAttachments, setCurrentAttachments] = useState<Attachment[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>(INITIAL_SUGGESTIONS);
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean>(true);
  const [currentDatabase, setCurrentDatabase] = useState<'sync' | 'app'>('sync');
  const [gatewayInfo, setGatewayInfo] = useState<any>(null);
  const flatListRef = useRef<FlatList<Message>>(null);
  const router = useRouter();

  // Effet pour faire défiler jusqu'au dernier message
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Vérifier l'état de santé du service et obtenir les infos au chargement
  useEffect(() => {
    const initializeService = async () => {
      try {
        console.log('🚀 Initialisation du service chatbot via API Gateway...');
        
        // Vérifier la santé du service
        const healthStatus = await checkChatbotHealth();
        console.log('✅ Service accessible:', healthStatus);
        setIsServiceAvailable(true);
        
        // Obtenir les informations sur l'API Gateway
        try {
          const info = await getGatewayInfo();
          setGatewayInfo(info);
          console.log('ℹ️ Informations API Gateway:', info);
        } catch (infoError) {
          console.log('⚠️ Impossible d\'obtenir les infos de l\'API Gateway (normal si endpoint non disponible)');
        }
        
        // Ajouter un message système avec les informations
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            text: `✅ Connexion établie via l'API Gateway (port 3000)\n🗄️ Base de données active: ${currentDatabase}\n\nToutes les requêtes passent maintenant par l'API Gateway.`,
            isUser: false,
            timestamp: new Date(),
          }
        ]);
        
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        setIsServiceAvailable(false);
        
        // Ajouter un message d'erreur
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            text: `❌ Le service chatbot est actuellement indisponible via l'API Gateway.\n\nVeuillez vérifier que :\n- L'API Gateway est démarré sur le port 3000\n- Le service chatbot est accessible\n\nErreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
            isUser: false,
            timestamp: new Date(),
          }
        ]);
      }
    };
    
    initializeService();
  }, [currentDatabase]);

  const handleAttachment = (uri: string, type: string, name: string) => {
    setCurrentAttachments([...currentAttachments, { uri, type, name }]);
  };

  const removeAttachment = (index: number) => {
    const updatedAttachments = [...currentAttachments];
    updatedAttachments.splice(index, 1);
    setCurrentAttachments(updatedAttachments);
  };

  const handleQuickReply = (suggestion: string) => {
    setInputText(suggestion);
  };

  const sendMessage = async () => {
    if (inputText.trim() === '' && currentAttachments.length === 0) return;
    
    if (!isServiceAvailable) {
      Alert.alert(
        "Service indisponible",
        "Le service chatbot est actuellement indisponible via l'API Gateway. Veuillez réessayer plus tard."
      );
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
      attachments: currentAttachments.length > 0 ? [...currentAttachments] : undefined,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText('');
    setCurrentAttachments([]);
    setIsLoading(true);

    try {
      console.log(`💬 Envoi du message via API Gateway (base: ${currentDatabase})`);
      
      // Appel à l'API du chatbot via l'API Gateway
      const response = await sendConversationMessage(userMessage.text, currentDatabase);
      console.log('📦 Réponse reçue:', response);
      
      const formattedResponse = formatChatbotResponse(response);
      
      // Vérifier si des données structurées sont disponibles
      const hasStructuredData = Array.isArray(response.data) && response.data.length > 0;
      
      // Création du message de réponse avec données structurées si disponibles
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: hasStructuredData ? "" : formattedResponse,
        isUser: false,
        timestamp: new Date(),
        data: Array.isArray(response.data) ? response.data : undefined,
        responseFormat: response.response_format,
        queryDescription: response.query_description,
      };
      
      setMessages((prevMessages) => [...prevMessages, botResponse]);
      
      // Générer de nouvelles suggestions basées sur la réponse
      if (response.analysis && response.analysis.similarPredefinedQueries) {
        const newSuggestions = response.analysis.similarPredefinedQueries
          .slice(0, 3)
          .map((query: { question?: string }) => query.question || "");
        
        if (newSuggestions.length > 0) {
          setQuickReplies(newSuggestions);
        } else {
          setQuickReplies([
            "Pouvez-vous m'en dire plus ?",
            "Afficher les statistiques",
            "Changer de base de données"
          ]);
        }
      } else {
        setQuickReplies([
          "Pouvez-vous m'en dire plus ?",
          "Afficher les statistiques", 
          "Changer de base de données"
        ]);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      
      // Ajouter un message d'erreur
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error 
          ? `❌ Erreur via API Gateway : ${error.message}\n\nVeuillez vérifier que l'API Gateway est accessible sur le port 3000.` 
          : "❌ Erreur inconnue lors du traitement via l'API Gateway.",
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour changer de base de données
  const handleDatabaseSwitch = async () => {
    try {
      const newDatabase = currentDatabase === 'sync' ? 'app' : 'sync';
      await switchDatabase(newDatabase);
      setCurrentDatabase(newDatabase);
      
      const switchMessage: Message = {
        id: Date.now().toString(),
        text: `🔄 Base de données changée vers: ${newDatabase}\n\nUne nouvelle conversation a été créée.`,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prevMessages) => [...prevMessages, switchMessage]);
    } catch (error) {
      console.error('Erreur lors du changement de base:', error);
      Alert.alert("Erreur", "Impossible de changer de base de données");
    }
  };

  // Fonction pour effacer la conversation
  const handleClearConversation = async () => {
    try {
      await clearConversation();
      setMessages([
        {
          id: '1',
          text: 'Nouvelle conversation démarrée via l\'API Gateway. Comment puis-je vous aider ?',
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setQuickReplies(INITIAL_SUGGESTIONS);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      Alert.alert("Erreur", "Impossible de supprimer la conversation");
    }
  };

  // Fonction pour gérer les clics sur les éléments de données
  const handleItemPress = (item: any) => {
    if ('firstname' in item && 'lastname' in item) {
      router.push({
        pathname: "/(tabs)/clients/[id]",
        params: { id: item.id.toString() }
      });
    } else if ('reference' in item && 'start_date' in item) {
      router.push({
        pathname: "/(tabs)/projects/[id]",
        params: { id: item.id.toString() }
      });
    } else if ('reference' in item && 'issue_date' in item) {
      router.push({
        pathname: "/(tabs)/documents/[id]",
        params: { id: item.id.toString() }
      });
    } else if (item.id && item.title && 'type' in item && (item.type === 'event' || item.type === 'assignment')) {
      if (item.project?.id) {
        router.push({
          pathname: "/(tabs)/projects/[id]",
          params: { id: item.project.id.toString() }
        });
      } else {
        router.push({
          pathname: "/(tabs)/planning"
        });
      }
    } else {
      Alert.alert(
        "Information",
        "Désolé, je ne peux pas ouvrir les détails de cet élément."
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold">TechniAssistant</Text>
          <Text className="text-xs text-gray-500">via API Gateway - Base: {currentDatabase}</Text>
        </View>
        
        <View className="flex-row items-center space-x-2">
          {/* Bouton pour changer de base */}
          <TouchableOpacity 
            onPress={handleDatabaseSwitch}
            className="bg-blue-100 px-2 py-1 rounded"
          >
            <Text className="text-blue-600 text-xs font-medium">{currentDatabase.toUpperCase()}</Text>
          </TouchableOpacity>
          
          {/* Bouton pour effacer la conversation */}
          <TouchableOpacity 
            onPress={handleClearConversation}
            className="p-2"
          >
            <Ionicons name="refresh" size={18} color="#6b7280" />
          </TouchableOpacity>
          
          {/* Indicateur de statut */}
          {!isServiceAvailable ? (
            <View className="flex-row items-center">
              <Ionicons name="cloud-offline-outline" size={18} color="#ef4444" />
              <Text className="text-red-500 ml-1 text-xs">Hors ligne</Text>
            </View>
          ) : (
            <View className="flex-row items-center">
              <Ionicons name="cloud-done-outline" size={18} color="#10b981" />
              <Text className="text-green-500 ml-1 text-xs">Port 3000</Text>
            </View>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        className="flex-1"
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item: Message) => item.id}
          renderItem={({ item }: { item: Message }) => (
            <ChatMessage message={item} onItemPress={handleItemPress} />
          )}
          contentContainerStyle={{ 
            padding: 16,
            flexGrow: 1,
            justifyContent: 'flex-end'
          }}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
          onLayout={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
          showsVerticalScrollIndicator={true}
          className="flex-1"
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10
          }}
          inverted={false}
          removeClippedSubviews={false}
        />

        <View className="border-t border-gray-200 bg-white p-4">
          <QuickReply
            suggestions={quickReplies}
            onPress={handleQuickReply}
          />

          <View className="flex-row items-end mt-2">
            <View className="flex-1 flex-col mr-2">
              <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3">
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Écrivez votre message..."
                  className="flex-1 mr-2 text-base"
                  multiline
                  maxLength={500}
                  scrollEnabled={true}
                />
                <AttachmentButton onFileSelected={handleAttachment} />
                <SpeechButton onSpeechResult={setInputText} />
              </View>

              {currentAttachments.length > 0 && (
                <View className="mt-2 flex-row flex-wrap items-center justify-start">
                  {currentAttachments.map((attachment, index) => (
                    <View key={index} className="mr-2 mb-2 rounded-lg overflow-hidden border border-gray-300">
                      {attachment.type.startsWith('image') ? (
                        <View className="relative">
                          <Image
                            source={{ uri: attachment.uri }}
                            className="w-16 h-16 rounded-lg"
                            resizeMode="cover"
                          />
                          <TouchableOpacity
                            onPress={() => removeAttachment(index)}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 z-10"
                          >
                            <Ionicons name="close" size={14} color="white" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View className="relative bg-gray-200 rounded-lg p-2 flex-row items-center">
                           <Ionicons name="document-outline" size={20} color="#4b5563" className="mr-1"/>
                          <Text className="text-sm text-gray-700 max-w-[100px]" numberOfLines={1}>
                            {attachment.name}
                          </Text>
                          <TouchableOpacity
                            onPress={() => removeAttachment(index)}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 z-10"
                          >
                            <Ionicons name="close" size={14} color="white" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={sendMessage}
              disabled={isLoading || (!inputText.trim() && currentAttachments.length === 0)}
              className={`ml-2 p-3 rounded-full ${
                isLoading || (!inputText.trim() && currentAttachments.length === 0)
                  ? 'bg-gray-300'
                  : 'bg-blue-600'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Ionicons name="send" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
