import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const EmptyState = () => {
  return (
    <View className="items-center justify-center p-8 bg-gray-50 rounded-xl my-4 border border-gray-200 border-dashed">
      <Ionicons name="mail-outline" size={50} color="#9ca3af" className="mb-4" />
      <Text className="text-lg font-semibold text-gray-700 mb-2 text-center">Aucun email prioritaire</Text>
      <Text className="text-sm text-gray-500 text-center leading-5">Félicitations ! Vous n'avez pas d'emails prioritaires à traiter aujourd'hui.</Text>
    </View>
  );
};

export default EmptyState; 