import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNavigationStore } from '../../store/navigationStore';

export default function ClientsLayout() {
  const router = useRouter();
  const { setCurrentPage } = useNavigationStore();

  return (
    <View className="flex-1 bg-gray-50">
      {/* En-tête */}
      <View className="bg-blue-600 p-4 shadow-md">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity 
            className="flex-row items-center"
            onPress={() => {
              setCurrentPage('dashboard');
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text className="text-white font-bold ml-2">Retour</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Clients</Text>
          <TouchableOpacity
            onPress={() => {
              // Fonction pour ajouter un nouveau client (à implémenter plus tard)
              // router.push('/pages/clients/nouveau');
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenu principal */}
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
} 