import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ClientData {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  addresses: {
    city: string;
  };
  created_at: string;
}

interface ClientCardProps {
  client: ClientData;
  onPress?: (client: ClientData) => void;
}

interface DataCardsProps {
  data: any[];
  format: string;
  title?: string;
  onItemPress?: (item: any) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(client);
    }
  };

  return (
    <TouchableOpacity 
      className="bg-white rounded-lg p-4 mb-2 shadow-sm border border-gray-200"
      onPress={handlePress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-bold">
            {client.firstname ? `${client.firstname} ${client.lastname}` : client.lastname}
          </Text>
          <Text className="text-gray-500 mt-1">{client.addresses.city || 'Ville non spécifiée'}</Text>
        </View>
        <View className="bg-blue-100 rounded-full p-2">
          <Ionicons name="person" size={24} color="#3b82f6" />
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-100">
        {client.email && client.email.indexOf('no-email') === -1 && (
          <View className="flex-row items-center mb-1">
            <Ionicons name="mail-outline" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-2 text-sm">{client.email}</Text>
          </View>
        )}
        
        {client.phone && (
          <View className="flex-row items-center">
            <Ionicons name="call-outline" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-2 text-sm">{client.phone}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Composant générique qui sélectionne le bon type d'affichage en fonction du format
const DataCards: React.FC<DataCardsProps> = ({ data, format, title, onItemPress }) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Rendu pour le format client (comme dans l'exemple)
  if (format === 'table' && data[0] && 'firstname' in data[0] && 'lastname' in data[0]) {
    return (
      <View className="mt-2">
        {title && (
          <Text className="text-lg font-semibold mb-2">{title}</Text>
        )}
        <FlatList
          data={data}
          keyExtractor={(item: ClientData) => item.id.toString()}
          renderItem={({ item }: { item: ClientData }) => (
            <ClientCard client={item} onPress={onItemPress} />
          )}
          scrollEnabled={false}
        />
      </View>
    );
  }

  // Format générique pour d'autres types de données
  return (
    <View className="mt-2">
      {title && (
        <Text className="text-lg font-semibold mb-2">{title}</Text>
      )}
      <FlatList
        data={data}
        keyExtractor={(_: any, index: number) => index.toString()}
        renderItem={({ item }: { item: any }) => (
          <View className="bg-white rounded-lg p-4 mb-2 shadow-sm border border-gray-200">
            {Object.entries(item).map(([key, value]) => (
              <View key={key} className="flex-row mb-1">
                <Text className="font-medium text-gray-700 mr-2">{key}:</Text>
                <Text className="text-gray-600">{String(value)}</Text>
              </View>
            ))}
          </View>
        )}
        scrollEnabled={false}
      />
    </View>
  );
};

export default DataCards; 