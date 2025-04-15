import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

interface ClientHeaderProps {
  firstname: string;
  lastname: string;
  company_name?: string;
  siret?: string;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({ 
  firstname, 
  lastname, 
  company_name, 
  siret 
}) => {
  return (
    <View className="bg-white rounded-lg shadow-sm w-full mb-4">
      <View className="p-6 items-center">
        <View className="flex-row justify-center items-center mb-2 w-full">
          <View className="flex-row items-center">
            <FontAwesome5 name="user-tie" size={28} color="#1e40af" />
            <View className="ml-3">
              <Text className="text-2xl font-bold text-blue-900">{firstname} {lastname}</Text>
              {company_name && <Text className="text-lg italic text-blue-700">{company_name}</Text>}
            </View>
          </View>
        </View>
        
        {siret && (
          <View className="flex-row items-center justify-center mt-2 w-full">
            <MaterialCommunityIcons name="identifier" size={20} color="#64748b" />
            <Text className="text-gray-600 ml-2">SIRET: {siret}</Text>
          </View>
        )}
      </View>
    </View>
  );
}; 

export default ClientHeader;