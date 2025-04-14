import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useFetch } from '../hooks/useFetch';
import { Project } from '../utils/interfaces/project.interface';

export function ProjetsScreen() {
  const { data, loading, error } = useFetch<Project[]>('projects', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
    }
  });

  if (loading) {
    return (
      <View className="flex items-center justify-center h-full">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="text-gray-600 mt-4">Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex items-center justify-center h-full">
        <Text className="text-red-500">Erreur: {error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="p-4">
        <Text className="text-2xl font-bold">Projets</Text>
      </View>
      <ScrollView 
        className="flex-1 px-4"
      >
        {data && data.length > 0 ? (
          data.map((projet: Project) => (
            <View 
              key={projet.id} 
              className="bg-white p-4 rounded shadow mb-4"
            >
              <Text className="font-medium">{projet.name}</Text>
              <Text className="text-gray-600 mt-1">{projet.description}</Text>
              <Text className="text-gray-600 mt-1">{projet.startDate ? new Date(projet.startDate).toLocaleDateString('fr-FR') : ''}</Text>
              <Text className="text-gray-600 mt-1">{projet.endDate ? new Date(projet.endDate).toLocaleDateString('fr-FR') : ''}</Text>
            </View>
          ))
        ) : (
          <Text className="text-gray-500">Aucun projet trouvé</Text>
        )}
      </ScrollView>
    </View>
  );
} 

export default ProjetsScreen;