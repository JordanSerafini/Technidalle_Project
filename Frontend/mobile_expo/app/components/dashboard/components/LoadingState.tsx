import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const LoadingState = () => {
  return (
    <View className="items-center justify-center p-6 bg-gray-50 rounded-xl my-4">
      <ActivityIndicator size="large" color="#3b82f6" className="mb-3" />
      <Text className="text-base font-medium text-gray-700 mb-2">Chargement des résumés d'emails...</Text>
      <View className="flex-row items-center mt-2">
        <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
        <Text className="text-sm text-gray-500 ml-1.5">Analyse en cours des messages importants</Text>
      </View>
    </View>
  );
};

export default LoadingState; 