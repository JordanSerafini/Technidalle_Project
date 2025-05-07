import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  onRetry?: () => void;
}

export const EmptyState = ({ onRetry }: EmptyStateProps) => {
  return (
    <View className="items-center justify-center p-8 bg-gray-50 rounded-xl my-4 border border-gray-200 border-dashed">
      <Ionicons name="mail-outline" size={50} color="#9ca3af" className="mb-4" />
      <Text className="text-lg font-semibold text-gray-700 mb-2 text-center">Aucun email prioritaire</Text>
      <Text className="text-sm text-gray-500 text-center leading-5 mb-4">Félicitations ! Vous n'avez pas d'emails prioritaires à traiter aujourd'hui.</Text>
      
      {onRetry && (
        <TouchableOpacity 
          className="mt-4 bg-blue-500 px-4 py-2 rounded-md"
          onPress={onRetry}
        >
          <Text className="text-white font-medium">Rafraîchir</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyState; 