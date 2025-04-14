import React from 'react';
import { Stack } from 'expo-router';

export default function ClientsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackVisible: true,
        headerBackTitle: 'Retour',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          headerTitle: 'Clients',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="[id]/index" 
        options={{
          headerTitle: 'Détails du client',
          headerShown: true,
        }} 
      />
    </Stack>
  );
} 