import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ClientCardProps } from '@/app/utils/interfaces/datacard.interface';

const ClientCard: React.FC<ClientCardProps> = ({ client, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(client);
    } else {
      router.push({
        pathname: '/(tabs)/clients/[id]',
        params: { id: client.id.toString() },
      });
    }
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-2 shadow-sm border border-gray-200"
      onPress={onPress ? () => onPress(client) : handlePress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-bold">
            {client.firstname ? `${client.firstname} ${client.lastname}` : client.lastname}
          </Text>
          <Text className="text-gray-500 mt-1">
            {client.addresses?.city || 'Ville non spécifiée'}
          </Text>
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

export default ClientCard;
