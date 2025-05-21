import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChatMessageProps, Attachment } from './types';
import { Ionicons } from '@expo/vector-icons';
import DataCards from './DataCards';

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const formattedTime = format(message.timestamp, 'HH:mm', { locale: fr });

  const renderAttachment = (attachment: Attachment, index: number) => {
    if (attachment.type.startsWith('image')) {
      return (
        <View key={index} className="mt-2">
          <Image 
            source={{ uri: attachment.uri }} 
            className="w-full h-36 rounded-md" 
            resizeMode="cover"
          />
        </View>
      );
    } else {
      return (
        <TouchableOpacity 
          key={index}
          className="mt-2 flex-row items-center p-2 bg-gray-100 rounded-md"
          onPress={() => Linking.openURL(attachment.uri)}
        >
          <Ionicons 
            name="document-outline" 
            size={20} 
            color="#4b5563" 
          />
          <Text className="ml-2 text-blue-700 flex-1" numberOfLines={1}>
            {attachment.name}
          </Text>
        </TouchableOpacity>
      );
    }
  };
  
  // Détermine s'il faut afficher des cartes de données
  const shouldRenderDataCards = !message.isUser && message.data && message.data.length > 0;
  
  return (
    <View 
      className={`mb-4 max-w-[95%] ${
        message.isUser ? 'self-end ml-auto' : 'self-start mr-auto'
      }`}
    >
      <View 
        className={`rounded-2xl p-3 ${
          message.isUser 
            ? 'bg-blue-600 rounded-tr-none' 
            : 'bg-gray-200 rounded-tl-none'
        }`}
      >
        <Text 
          className={`${
            message.isUser ? 'text-white' : 'text-black'
          }`}
        >
          {message.text}
        </Text>

        {message.attachments && message.attachments.length > 0 && (
          <View className="mt-1">
            {message.attachments.map(renderAttachment)}
          </View>
        )}
      </View>
      
      {/* Afficher les cartes de données si disponibles */}
      {shouldRenderDataCards && message.data && (
        <DataCards 
          data={message.data} 
          format={message.responseFormat || 'default'} 
          title={message.queryDescription}
        />
      )}
      
      <Text className="text-xs text-gray-500 mt-1 ml-1">
        {formattedTime}
      </Text>
    </View>
  );
};

export default ChatMessage; 