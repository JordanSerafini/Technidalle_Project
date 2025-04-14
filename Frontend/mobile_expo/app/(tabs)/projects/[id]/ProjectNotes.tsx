import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface ProjectNotesProps {
  notes: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const ProjectNotes: React.FC<ProjectNotesProps> = ({
  notes,
  isOpen,
  onToggle
}) => {
  return (
    <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
      <TouchableOpacity 
        className="flex-row justify-between items-center"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="note-text" size={22} color="#1e40af" className="mr-2" />
          <Text className="text-lg font-bold ml-2">Notes</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View className="mt-4">
          <Text className="text-gray-800">{notes}</Text>
        </View>
      )}
    </View>
  );
}; 