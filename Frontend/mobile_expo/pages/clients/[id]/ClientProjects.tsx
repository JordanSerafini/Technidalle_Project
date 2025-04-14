import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Project, project_status } from '@/app/utils/interfaces/project.interface';

interface ClientProjectsProps {
  projects?: Project[];
  isLoading: boolean;
  error?: any;
  isOpen: boolean;
  onToggle: () => void;
  onProjectPress: (projectId: number) => void;
}

export const ClientProjects: React.FC<ClientProjectsProps> = ({
  projects,
  isLoading,
  error,
  isOpen,
  onToggle,
  onProjectPress
}) => {
  return (
    <View className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full items-center tracking-widest">
      <TouchableOpacity 
        className="flex-row justify-between items-center w-full mb-4"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="home-variant" size={24} color="#1e40af" />
          <Text className="text-lg font-semibold text-blue-900 ml-2">Chantiers</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <>
          {isLoading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : error ? (
            <Text className="text-red-500">Erreur lors du chargement des chantiers</Text>
          ) : projects && projects.length > 0 ? (
            <View className="w-full">
              {projects.map((project: Project) => (
                <TouchableOpacity 
                  key={project.id}
                  className="flex-row items-center mb-3 w-full"
                  onPress={() => onProjectPress(project.id)}
                >
                  <MaterialCommunityIcons name="home-variant" size={24} color="#2563eb" />
                  <View className="ml-3 flex-1">
                    <Text className="text-blue-700">{project.name}</Text>
                    <Text className="text-gray-500 text-sm">{project.reference}</Text>
                  </View>
                  <Text className={`text-xs font-semibold px-2 py-1 rounded-full mr-2 ${
                    project.status === project_status.en_cours ? 'bg-blue-100 text-blue-800' :
                    project.status === project_status.termine ? 'bg-green-100 text-green-800' :
                    project.status === project_status.prospect ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status === project_status.en_cours ? 'En cours' :
                     project.status === project_status.termine ? 'Terminé' :
                     project.status === project_status.prospect ? 'Prospect' :
                     'Autre'}
                  </Text>
                  <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="flex-row items-center">
              <MaterialIcons name="info-outline" size={20} color="#64748b" />
              <Text className="text-gray-500 ml-2">Aucun chantier disponible</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}; 