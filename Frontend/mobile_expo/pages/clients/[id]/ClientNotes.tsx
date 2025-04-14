import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface ClientNotesProps {
  notes?: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const ClientNotes: React.FC<ClientNotesProps> = ({
  notes,
  isOpen,
  onToggle
}) => {
  if (!notes) return null;
  
  return (
    <View className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full items-center tracking-widest">
      <TouchableOpacity 
        className="flex-row justify-between items-center w-full mb-4"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="sticky-note-2" size={24} color="#1e40af" />
          <Text className="text-lg font-semibold text-blue-900 ml-2">Notes</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View className="flex-row">
          <MaterialIcons name="format-quote" size={20} color="#64748b" style={{alignSelf: 'flex-start'}} />
          <Text className="text-gray-700 ml-2 flex-1">{notes}</Text>
        </View>
      )}
    </View>
  );
}; 