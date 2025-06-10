import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import './global.css';
import { setupUrlCleaner } from './utils/cleanupRouter';
import 'react-native-gesture-handler';

export default function RootLayout() {
  // Initialiser le nettoyeur d'URL pour résoudre le problème avec __EXPO_ROUTER_key
  useEffect(() => {
    const { cleanup } = setupUrlCleaner();
    
    // Nettoyer au démontage du composant
    return cleanup;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
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
          <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
