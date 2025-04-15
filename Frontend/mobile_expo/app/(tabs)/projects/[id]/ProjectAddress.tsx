import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface AddressData {
  street_number?: string;
  street_name: string;
  additional_address?: string;
  zip_code: string;
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface ProjectAddressProps {
  address: AddressData;
  isOpen: boolean;
  onToggle: () => void;
  onLocationPress: () => void;
}

export const ProjectAddress: React.FC<ProjectAddressProps> = ({
  address,
  isOpen,
  onToggle,
  onLocationPress
}) => {
  return (
    <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
      <TouchableOpacity 
        className="flex-row justify-between items-center"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="location-on" size={22} color="#1e40af" className="mr-2" />
          <Text className="text-lg font-bold ml-2">Adresse du chantier</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View className="mt-4">
          <View className="mb-3">
            <Text className="text-gray-800">
              {address.street_number && `${address.street_number} `}
              {address.street_name}
            </Text>
            
            {address.additional_address && (
              <Text className="text-gray-800">{address.additional_address}</Text>
            )}
            
            <Text className="text-gray-800">
              {address.zip_code} {address.city}
            </Text>
            
            {address.country && (
              <Text className="text-gray-800">{address.country}</Text>
            )}
          </View>
          
          <TouchableOpacity 
            className="flex-row items-center mt-2 bg-blue-500 py-2 px-4 rounded-lg self-start"
            onPress={onLocationPress}
          >
            <MaterialIcons name="location-on" size={18} color="white" />
            <Text className="text-white ml-1 font-medium">Voir sur la carte</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}; 

export default ProjectAddress;