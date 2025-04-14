import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, Text } from 'react-native';

export default function TabLayout() {
  const tintColor = '#2f95dc';
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        headerShown: false,
        // Suppression des options personnalisées qui causent des erreurs
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
          },
          default: {
            backgroundColor: 'white',
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color }) => <Text style={{ color }}>👥</Text>,
        }}
      />
      <Tabs.Screen
        name="projets"
        options={{
          title: 'Projets',
          tabBarIcon: ({ color }) => <Text style={{ color }}>📁</Text>,
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: 'Planning',
          tabBarIcon: ({ color }) => <Text style={{ color }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color }) => <Text style={{ color }}>📄</Text>,
        }}
      />
      <Tabs.Screen
        name="search-results"
        options={{
          title: 'Recherche',
          tabBarIcon: ({ color }) => <Text style={{ color }}>🔍</Text>,
          tabBarButton: () => null, // Cache cet onglet dans la barre d'onglets
        }}
      />
    </Tabs>
  );
}
