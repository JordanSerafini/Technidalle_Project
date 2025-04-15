import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';

interface ClientData {
  id: number;
  firstname: string;
  lastname: string;
  company_name?: string;
  email: string;
  phone?: string;
  mobile?: string;
}

interface ProjectClientProps {
  client: ClientData;
  isOpen: boolean;
  onToggle: () => void;
  onClientPress: (clientId: number) => void;
}

export const ProjectClient: React.FC<ProjectClientProps> = ({
  client,
  isOpen,
  onToggle,
  onClientPress
}) => {
  return (
    <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
      <TouchableOpacity 
        className="flex-row justify-between items-center"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <FontAwesome5 name="user-tie" size={18} color="#1e40af" className="mr-2" />
          <Text className="text-lg font-bold ml-2">Client</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View className="mt-2">
          <TouchableOpacity 
            className="flex-row justify-between items-center py-2"
            onPress={() => onClientPress(client.id)}
          >
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-600">Nom:</Text>
                <Text className="font-medium">{client.firstname} {client.lastname}</Text>
              </View>
              
              {client.company_name && (
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-600">Société:</Text>
                  <Text>{client.company_name}</Text>
                </View>
              )}
              
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-600">Email:</Text>
                <Text>{client.email}</Text>
              </View>
              
              {(client.phone || client.mobile) && (
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-600">Téléphone:</Text>
                  <Text>{client.mobile || client.phone}</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}; 

export default ProjectClient;