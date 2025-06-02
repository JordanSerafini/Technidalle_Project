import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { cleanupExpoRouterKey } from '@/app/utils/cleanupRouter';

export default function ChatbotLayout() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      cleanupExpoRouterKey();
    }
  }, []);
  

  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',

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
          headerTitle: 'Chatbot',
          headerShown: false,
        }} 
      />
      
    </Stack>
  );
} 