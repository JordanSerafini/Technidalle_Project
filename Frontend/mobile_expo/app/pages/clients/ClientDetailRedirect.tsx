import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useClientsStore } from '../../store/clientsStore';

export default function ClientDetailRedirect() {
  const router = useRouter();
  const { selectedClient } = useClientsStore();

  useEffect(() => {
    // Redirection immédiate sans délai
    if (selectedClient) {
      // Redirection directe vers l'écran de détail
      router.replace('/pages/clients/ClientDetail');
    } else {
      // Si aucun client n'est sélectionné, redirection directe vers la liste des clients
      router.replace('/clients');
    }
  }, [selectedClient, router]);

  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#0000ff" />
      <Text className="mt-4 text-gray-600">Redirection en cours...</Text>
    </View>
  );
} 