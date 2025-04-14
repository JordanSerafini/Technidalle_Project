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
    <View className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full items-center tracking-widest">
      <TouchableOpacity 
        className="flex-row justify-between items-center w-full mb-4"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <FontAwesome5 name="building" size={22} color="#1e40af" />
          <Text className="text-lg font-semibold text-blue-900 ml-2">Adresse</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <>
          <View className="mb-2">
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
        </>
      )}
    </View>
  );
}; 