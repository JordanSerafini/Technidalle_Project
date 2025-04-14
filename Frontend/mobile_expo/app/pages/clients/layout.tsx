import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Slot, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ClientsLayout() {
  const router = useRouter();

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitle: 'Retour',
          headerBackVisible: true,
          headerLeft: ({ canGoBack }) => {
            if (!canGoBack) {
              return (
                <TouchableOpacity 
                  onPress={() => router.navigate('/(tabs)')}
                  style={{ marginLeft: 10, padding: 10 }}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
              );
            }
            return undefined; // Important: Retourner undefined pour utiliser le comportement par défaut
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Clients',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => {
                  // Fonction pour ajouter un nouveau client (à implémenter plus tard)
                  // router.navigate('/pages/clients/nouveau');
                }}
                style={{ marginRight: 10 }}
              >
                <Ionicons name="add-circle-outline" size={24} color="white" />
              </TouchableOpacity>
            ),
          }}
        />
        
        <Stack.Screen
          name="ClientDetail"
          options={{
            title: '',
            headerShown: true,
          }}
        />
      </Stack>
      <Slot />
    </>
  );
} 