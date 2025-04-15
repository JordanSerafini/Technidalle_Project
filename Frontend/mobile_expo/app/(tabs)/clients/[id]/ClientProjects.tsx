import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Project, project_status } from '@/app/utils/interfaces/project.interface';
import { router } from 'expo-router';

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
  
  // Fonction pour obtenir les classes Tailwind selon le statut
  const getStatusClasses = (status: string | undefined) => {
    if (status === project_status.en_cours) {
      return { badge: 'bg-blue-600', text: 'text-white font-semibold text-xs' };
    }
    if (status === project_status.termine) {
      return { badge: 'bg-green-600', text: 'text-white font-semibold text-xs' };
    }
    if (status === project_status.prospect) {
      return { badge: 'bg-yellow-600', text: 'text-white font-semibold text-xs' };
    }
    return { badge: 'bg-gray-500', text: 'text-white font-semibold text-xs' };
  };
  
  // Fonction pour obtenir le texte du statut
  const getStatusText = (status: string | undefined) => {
    if (status === project_status.en_cours) return 'En cours';
    if (status === project_status.termine) return 'Terminé';
    if (status === project_status.prospect) return 'Prospect';
    return 'Autre';
  };
  
  // Fonction pour naviguer vers la page de détail du projet
  const handleProjectPress = (projectId: number) => {
    router.push({
      pathname: "/(tabs)/projects/[id]",
      params: { id: projectId }
    });
  };
  
  return (
    <View className="bg-white rounded-lg shadow-sm w-full mb-4">
      <TouchableOpacity 
        className="p-3 flex-row justify-between items-center w-full"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <View className="w-8 h-8 flex items-center justify-center">
            <MaterialCommunityIcons name="home-variant" size={24} color="#1e40af" />
          </View>
          <Text className="text-lg font-semibold text-blue-900 ml-3">Chantiers</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View className="px-4 pb-4 w-full">
          {isLoading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : error ? (
            <Text className="text-red-500">Erreur lors du chargement des chantiers</Text>
          ) : projects && projects.length > 0 ? (
            <View className="w-full">
              {projects.map((project: Project) => {
                // Détermine les classes pour le statut
                const statusClasses = getStatusClasses(project.status);
                const statusText = getStatusText(project.status);
                
                return (
                  <TouchableOpacity 
                    key={project.id}
                    className="flex-row items-center w-full mb-2.5"
                    onPress={() => handleProjectPress(project.id)}
                  >
                    <MaterialCommunityIcons name="home-variant" size={24} color="#2563eb" />
                    <View className="ml-3 flex-1">
                      <Text className="text-blue-700">{project.name}</Text>
                      <Text className="text-gray-500 text-sm">{project.reference}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded-full mr-2 ${statusClasses.badge}`}>
                      <Text className={statusClasses.text}>
                        {statusText}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View className="flex-row items-center">
              <MaterialIcons name="info-outline" size={20} color="#64748b" />
              <Text className="text-gray-500 ml-2">Aucun chantier disponible</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}; 

export default ClientProjects;