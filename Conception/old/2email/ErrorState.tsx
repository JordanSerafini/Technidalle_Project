import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ErrorStateProps = {
  error: string;
  onRetry: () => void;
};

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  return (
    <View className="bg-red-50 p-5 rounded-xl mb-4 items-center border border-red-100">
      <View className="mb-3">
        <Ionicons name="alert-circle" size={40} color="#dc2626" />
      </View>
      
      <Text className="text-base font-bold text-red-700 mb-2 text-center">Impossible de charger les emails</Text>
      <Text className="text-sm text-red-900 mb-4 text-center">{error}</Text>
      
      <TouchableOpacity 
        className="bg-blue-500 flex-row items-center justify-center py-2.5 px-4 rounded-lg mt-1"
        onPress={onRetry}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh" size={18} color="#ffffff" className="mr-2" />
        <Text className="text-white font-semibold text-sm">Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ErrorState; 