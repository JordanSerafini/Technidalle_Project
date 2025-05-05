import React from 'react';
import { View, Text, TouchableHighlight, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AccordionItem from '../../../components/AccordionItem';
import { Stage } from '@/app/utils/interfaces/project.interface';

// Fonction de formatage de date robuste (copie de ProjectInfo.tsx)
const formatDate = (dateValue: any): string => {
  if (!dateValue) {
    return 'Non définie';
  }
  
  try {
    let dateObj: Date;
    
    if (typeof dateValue === 'string') {
      if (/^\d+$/.test(dateValue)) {
        dateObj = new Date(parseInt(dateValue));
      } else {
        dateObj = new Date(dateValue);
      }
    } else if (typeof dateValue === 'number') {
      dateObj = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      dateObj = dateValue;
    } else {
      return 'Format inconnu';
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'Non définie';
    }
    
    return dateObj.toLocaleDateString('fr-FR');
    
  } catch (error) {
    return 'Non définie';
  }
};

interface ProjectStagesProps {
  projectId: number;
  stages: Stage[];
  isOpen: boolean;
  onToggle: () => void;
  onAddStage: () => void;
}

export const ProjectStages: React.FC<ProjectStagesProps> = ({
  projectId,
  stages,
  isOpen,
  onToggle,
  onAddStage
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
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onAddStage} className="p-1 mr-2">
              <Ionicons name="add-circle-outline" size={26} color="#16a34a" />
            </TouchableOpacity>
            <Ionicons 
              name={isOpen ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#2563eb" 
            />
          </View>
        </View>
      </TouchableHighlight>
      
      <AccordionItem isExpanded={isOpen}>
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
                    {formatDate(stage.start_date)}
                    {stage.end_date ? ` - ${formatDate(stage.end_date)}` : ''}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">Aucune étape définie pour ce projet</Text>
          )}
        </View>
      </AccordionItem>
    </View>
  );
}; 

export default ProjectStages;