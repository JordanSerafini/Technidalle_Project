import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface ProjectHeaderProps {
  name: string;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ name }) => {
  return (
    <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
      <TouchableOpacity onPress={() => router.back()} className="mr-4">
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text className="text-xl font-bold flex-1">{name}</Text>
    </View>
  );
};

export default ProjectHeader; 