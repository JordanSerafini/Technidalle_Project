import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import './global.css';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          headerBackTitle: 'Retour',
          headerBackVisible: true,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="components/modal" options={{ presentation: 'modal' }} />
        <Stack.Screen 
          name="pages/clients/ClientDetail" 
          options={{ 
            headerShown: true,
            headerBackTitle: 'Retour',
            headerBackVisible: true,
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
