import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

interface Address {
  street_number?: string;
  street_name: string;
  additional_address?: string;
  zip_code: string;
  city: string;
  country?: string;
}

interface ClientAddressProps {
  address: Address;
  isOpen: boolean;
  onToggle: () => void;
  onLocationPress: () => void;
}

export const ClientAddress: React.FC<ClientAddressProps> = ({
  address,
  isOpen,
  onToggle,
  onLocationPress
}) => {
  if (!address) return null;

  return (
    <View className="bg-white rounded-lg shadow-sm w-full mb-4">
      <TouchableOpacity 
        className="p-3 flex-row justify-between items-center w-full"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <View className="w-8 h-8 flex items-center justify-center">
            <FontAwesome5 name="building" size={22} color="#1e40af" />
          </View>
          <Text className="text-lg font-semibold text-blue-900 ml-3">Adresse</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View className="px-4 pb-4 w-full flex flex-col gap-2 items-center">
          <View className="mb-2 items-center">
            <Text className="text-gray-700">
              {address.street_number} {address.street_name}
              {address.additional_address && `, ${address.additional_address}`}
            </Text>
            <Text className="text-gray-700">{address.zip_code} {address.city}</Text>
            {address.country && <Text className="text-gray-700">{address.country}</Text>}
          </View>
          
          <TouchableOpacity 
            className="flex-row items-center mt-2" 
            onPress={onLocationPress}
          >
            <FontAwesome5 name="map-marked-alt" size={22} color="#2563eb" />
            <Text className="ml-3 text-blue-700">Voir sur la carte</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}; 