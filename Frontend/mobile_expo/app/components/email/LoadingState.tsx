import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const LoadingState = () => {
  return (
    <View className="items-center justify-center p-6 bg-blue-50 rounded-xl my-4 border border-blue-100 shadow-sm">
      <ActivityIndicator size="large" color="#3b82f6" className="mb-4 h-12" />
      <Text className="text-lg font-semibold text-blue-800 mb-2 text-center">Chargement des résumés d'emails...</Text>
      <View className="flex-row items-center mt-3 bg-blue-50/70 p-2.5 rounded-lg w-full justify-center">
        <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
        <Text className="text-sm text-gray-500 ml-2">Analyse en cours des messages importants</Text>
      </View>
    </View>
  );
};

export default LoadingState; 