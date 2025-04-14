import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
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

// Définir des styles fixes pour les différents statuts
const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
  },
  enCoursBackground: {
    backgroundColor: '#2563eb', // Bleu vif
  },
  enCoursText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  termineBackground: {
    backgroundColor: '#16a34a', // Vert vif
  },
  termineText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  prospectBackground: {
    backgroundColor: '#ca8a04', // Jaune vif
  },
  prospectText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  defaultBackground: {
    backgroundColor: '#6b7280', // Gris
  },
  defaultText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  }
});

export const ClientProjects: React.FC<ClientProjectsProps> = ({
  projects,
  isLoading,
  error,
  isOpen,
  onToggle,
  onProjectPress
}) => {
  
  // Fonction pour obtenir les styles selon le statut
  const getStatusStyles = (status: string | undefined) => {
    if (status === project_status.en_cours) {
      return { background: styles.enCoursBackground, text: styles.enCoursText };
    }
    if (status === project_status.termine) {
      return { background: styles.termineBackground, text: styles.termineText };
    }
    if (status === project_status.prospect) {
      return { background: styles.prospectBackground, text: styles.prospectText };
    }
    return { background: styles.defaultBackground, text: styles.defaultText };
  };
  
  // Fonction pour obtenir le texte du statut
  const getStatusText = (status: string | undefined) => {
    if (status === project_status.en_cours) return 'En cours';
    if (status === project_status.termine) return 'Terminé';
    if (status === project_status.prospect) return 'Prospect';
    return 'Autre';
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
                // Détermine les styles pour le statut
                const statusStyles = getStatusStyles(project.status);
                const statusText = getStatusText(project.status);
                
                return (
                  <TouchableOpacity 
                    key={project.id}
                    className="flex-row items-center w-full"
                    style={{ marginBottom: 10 }}
                    onPress={() => onProjectPress(project.id)}
                  >
                    <MaterialCommunityIcons name="home-variant" size={24} color="#2563eb" />
                    <View className="ml-3 flex-1">
                      <Text className="text-blue-700">{project.name}</Text>
                      <Text className="text-gray-500 text-sm">{project.reference}</Text>
                    </View>
                    <View style={[styles.statusBadge, statusStyles.background]}>
                      <Text style={statusStyles.text}>
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