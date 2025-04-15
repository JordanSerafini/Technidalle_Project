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
    <View className="bg-white rounded-lg shadow-sm w-full mb-4">
      <TouchableOpacity 
        className="p-3 flex-row justify-between items-center w-full"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <View className="w-8 h-8 flex items-center justify-center">
            <MaterialIcons name="sticky-note-2" size={24} color="#1e40af" />
          </View>
          <Text className="text-lg font-semibold text-blue-900 ml-3">Notes</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View className="px-4 pb-4 w-full">
          <View className="flex-row w-full">
            <MaterialIcons name="format-quote" size={20} color="#64748b" className="self-start" />
            <Text className="text-gray-700 ml-2 flex-1">{notes}</Text>
          </View>
        </View>
      )}
    </View>
  );
}; 

export default ClientNotes;