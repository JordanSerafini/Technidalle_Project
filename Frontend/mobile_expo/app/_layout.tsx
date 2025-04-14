import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import './global.css';
import { setupUrlCleaner } from './utils/cleanupRouter';

export default function RootLayout() {
  // Initialiser le nettoyeur d'URL pour résoudre le problème avec __EXPO_ROUTER_key
  useEffect(() => {
    const { cleanup } = setupUrlCleaner();
    
    // Nettoyer au démontage du composant
    return cleanup;
  }, []);

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
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
