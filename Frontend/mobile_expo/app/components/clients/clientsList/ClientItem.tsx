import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Client } from '@/app/utils/interfaces/client.interface';
import { formatClientData } from '@/app/utils/formatClientData';

const { width } = Dimensions.get('window');

interface ClientItemProps {
  client: Client;
  onPhonePress: (client: Client, event: any) => void;
  onEmailPress: (email: string | undefined, event: any) => void;
  onItemPress: (client: Client) => void;
}

const ClientItem = React.memo(({ 
  client, 
  onPhonePress, 
  onEmailPress, 
  onItemPress 
}: ClientItemProps) => {
  const { 
    displayName, 
    secondaryDisplay, 
    statusColor, 
    displayStatus, 
    hasRecentOrders,
    hasPhone,
    hasEmail,
    city
  } = formatClientData(client);
  
  // Handlers optimisés pour éviter les re-rendus
  const handleCallPress = useCallback((e: any) => {
    onPhonePress(client, e);
  }, [client, onPhonePress]);
  
  const handleMailPress = useCallback((e: any) => {
    onEmailPress(client.email, e);
  }, [client.email, onEmailPress]);
  
  const handleItemPress = useCallback(() => {
    onItemPress(client);
  }, [client, onItemPress]);
  
  return (
    <TouchableOpacity 
      key={client.id} 
      onPress={handleItemPress}
      className="flex flex-row justify-between w-full mb-1 p-2 border-b bg-white"
      style={{ width: width - 32 }}
    >
      {/* Nom, prénom et société */}
      <View className="flex-col gap-y-1 flex-1">
        <Text className="font-bold text-blue-900" numberOfLines={1}>
          {displayName}
        </Text>
        {secondaryDisplay ? (
          <Text className={`font-thin tracking-wide italic ${secondaryDisplay === "Particulier" ? 'text-green-700' : 'text-blue-700'}`} numberOfLines={1}>
            {secondaryDisplay}
          </Text>
        ) : null}
        
        <View className="flex-row items-center">
          {city ? (
            <Text className="text-gray-500 text-xs mr-2" numberOfLines={1}>
              {city}
            </Text>
          ) : null}
          
          {displayStatus && (
            <Text className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
              {displayStatus}
            </Text>
          )}
          
          {hasRecentOrders && (
            <View className="ml-2 w-2 h-2 rounded-full bg-green-500"></View>
          )}
        </View>
      </View>
      
      {/* Boutons pour appeler et envoyer un email */}
      <View className="flex-row gap-x-3 items-center">
        {hasPhone && (
          <TouchableOpacity onPress={handleCallPress}>
            <Ionicons name="call-outline" size={24} color="#2563eb" />
          </TouchableOpacity>
        )}
        {hasEmail && (
          <TouchableOpacity onPress={handleMailPress}>
            <Ionicons name="mail-outline" size={24} color="#2563eb" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Optimisation: ne re-rendre que si le client a changé
  return prevProps.client.id === nextProps.client.id;
});

export default ClientItem; 