import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Slot, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNavigationStore } from '../../store/navigationStore';

export default function ClientsLayout() {
  const router = useRouter();
  const { setCurrentPage } = useNavigationStore();

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
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => {
                console.log("Layout - Clic sur le bouton retour");
                setCurrentPage('dashboard');
                console.log("Layout - CurrentPage mis à jour");
                router.back();
                console.log("Layout - Navigation back effectuée");
              }}
              style={{ marginLeft: 10, padding: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
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
                  // router.push('/pages/clients/nouveau');
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
            headerBackTitle: 'Retour',
            headerBackVisible: true,
          }}
        />
      </Stack>
      <Slot />
    </>
  );
} 