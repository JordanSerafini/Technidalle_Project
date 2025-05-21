import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ChatMessage from '@/app/components/chatbot/ChatMessage';
import { Message, Attachment } from '@/app/components/chatbot/types';
import QuickReply from '@/app/components/chatbot/QuickReply';
import AttachmentButton from '@/app/components/chatbot/AttachmentButton';
import { sendMessageToChatbot, formatChatbotResponse, checkChatbotHealth } from '@/app/utils/functions/chatbot/chatbot.function';

// Suggestions de démarrage pour la conversation
const INITIAL_SUGGESTIONS = [
  "Comment puis-je créer un nouveau projet ?",
  "Quelles sont les solutions pour mes clients ?",
  "Où trouver mes documents ?",
  "Comment analyser mes emails ?"
];

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Bonjour ! Je suis TechniAssistant, votre assistant virtuel. Comment puis-je vous aider aujourd\'hui ?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAttachments, setCurrentAttachments] = useState<Attachment[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>(INITIAL_SUGGESTIONS);
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean>(true);
  const flatListRef = useRef<FlatList<Message>>(null);
  const router = useRouter();

  // Effet pour faire défiler jusqu'au dernier message
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Vérifier l'état de santé du service chatbot au chargement
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await checkChatbotHealth();
        setIsServiceAvailable(true);
      } catch (error) {
        console.error('Erreur lors de la vérification du service chatbot:', error);
        setIsServiceAvailable(false);
        
        // Ajouter un message système pour informer l'utilisateur
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            text: 'Le service de chatbot est actuellement indisponible. Veuillez réessayer plus tard.',
            isUser: false,
            timestamp: new Date(),
          }
        ]);
      }
    };
    
    checkHealth();
  }, []);

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
        "Le service de chatbot est actuellement indisponible. Veuillez réessayer plus tard."
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
      // Appel à l'API du chatbot
      const response = await sendMessageToChatbot(userMessage.text);
      const formattedResponse = formatChatbotResponse(response);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: formattedResponse,
        isUser: false,
        timestamp: new Date(),
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
            "Comment configurer mon compte ?",
            "Quelles sont les prochaines étapes ?"
          ]);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      
      // Ajouter un message d'erreur
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error 
          ? `Désolé, une erreur s'est produite : ${error.message}` 
          : "Désolé, une erreur s'est produite lors du traitement de votre demande.",
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAttachmentPreview = () => {
    if (currentAttachments.length === 0) return null;

    return (
      <View className="flex-row flex-wrap p-2 bg-gray-50 border-t border-gray-200">
        {currentAttachments.map((attachment, index) => (
          <View key={index} className="bg-white rounded-md p-1 m-1 flex-row items-center">
            <Ionicons 
              name={attachment.type.startsWith('image') ? "image-outline" : "document-outline"} 
              size={16} 
              color="#4b5563" 
            />
            <Text className="text-xs ml-1 mr-1 max-w-[100px]" numberOfLines={1}>
              {attachment.name}
            </Text>
            <TouchableOpacity onPress={() => removeAttachment(index)}>
              <Ionicons name="close-circle" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">TechniAssistant</Text>
        {!isServiceAvailable && (
          <View className="ml-auto flex-row items-center">
            <Ionicons name="cloud-offline-outline" size={18} color="#ef4444" />
            <Text className="text-red-500 ml-1 text-xs">Hors ligne</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item: Message) => item.id}
          renderItem={({ item }: { item: Message }) => <ChatMessage message={item} />}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isLoading && (
          <View className="p-3 items-center justify-center">
            <ActivityIndicator size="small" color="#2563eb" />
          </View>
        )}

        {quickReplies.length > 0 && !isLoading && (
          <QuickReply 
            suggestions={quickReplies} 
            onPress={handleQuickReply}
          />
        )}

        {renderAttachmentPreview()}

        <View className="p-2 border-t border-gray-200 bg-white flex-row items-center">
          <AttachmentButton onFileSelected={handleAttachment} />
          
          <TextInput
            className="flex-1 bg-gray-100 p-3 rounded-full mr-2"
            placeholder="Tapez votre message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            onPress={sendMessage}
            className={`p-3 rounded-full ${
              (inputText.trim() === '' && currentAttachments.length === 0) || !isServiceAvailable
                ? 'bg-gray-300' 
                : 'bg-blue-600'
            }`}
            disabled={(inputText.trim() === '' && currentAttachments.length === 0) || !isServiceAvailable}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
