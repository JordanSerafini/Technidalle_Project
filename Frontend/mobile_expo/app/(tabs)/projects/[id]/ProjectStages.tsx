import React from 'react';
import { View, Text, TouchableHighlight, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface StageData {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  completion_percentage?: number;
}

interface ProjectStagesProps {
  stages: StageData[];
  isOpen: boolean;
  onToggle: () => void;
}

export const ProjectStages: React.FC<ProjectStagesProps> = ({
  stages,
  isOpen,
  onToggle
}) => {
  return (
    <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
      <TouchableHighlight
        onPress={onToggle}
        underlayColor="#f0f0f0"
        style={{
          borderRadius: 8,
          marginHorizontal: -8,
          marginVertical: -8,
          padding: 8
        }}
      >
        <View className="flex-row justify-between items-center py-2">
          <View className="flex-row items-center">
            <MaterialIcons name="linear-scale" size={22} color="#1e40af" />
            <Text className="text-lg font-bold ml-2">Étapes du projet</Text>
          </View>
          <Ionicons 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#2563eb" 
          />
        </View>
      </TouchableHighlight>
      
      {isOpen && (
        <View className="mt-4">
          {stages && stages.length > 0 ? (
            stages.map((stage) => (
              <View key={stage.id} className="border-l-4 border-blue-500 pl-3 mb-3 py-2">
                <View className="flex-row justify-between">
                  <Text className="font-bold">{stage.name}</Text>
                  {stage.completion_percentage !== undefined && (
                    <Text>{stage.completion_percentage}%</Text>
                  )}
                </View>
                
                {stage.description && (
                  <Text className="text-gray-600 mt-1">{stage.description}</Text>
                )}
                
                <View className="flex-row mt-2">
                  <Text className="text-gray-600 text-sm">
                    {stage.start_date ? new Date(stage.start_date).toLocaleDateString('fr-FR') : 'Non défini'} 
                    {stage.end_date ? ` - ${new Date(stage.end_date).toLocaleDateString('fr-FR')}` : ''}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">Aucune étape définie pour ce projet</Text>
          )}
        </View>
      )}
    </View>
  );
}; 

export default ProjectStages;