import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useClientsStore } from '../../store/clientsStore';

export default function ClientDetailRedirect() {
  const router = useRouter();
  const { selectedClient } = useClientsStore();

  useEffect(() => {
    // Si un client est sélectionné, on navigue vers la page de détail
    if (selectedClient) {
      // Redirection immédiate vers l'écran de détail
      try {
        // On utilise un chemin absolu pour éviter les problèmes de navigation relative
        router.push('/pages/clients/ClientDetail');
      } catch (error) {
        console.error('Erreur de navigation:', error);
        // Fallback en cas d'erreur - redirection directe vers la liste des clients
        router.replace('/clients');
      }
    } else {
      // Si aucun client n'est sélectionné, on retourne directement à la liste des clients
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