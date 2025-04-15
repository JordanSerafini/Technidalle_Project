import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFetch } from '../../hooks/useFetch';
import { Project, project_status } from '../../utils/interfaces/project.interface';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProjectFilter from '../../components/search/project_filter';
import { useProjectStore } from '../../store/projectStore';
import ProjectsFab from '../../components/FAB/projects/projects.fab';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';

const statusLabels: Record<project_status, string> = {
  prospect: 'Prospect',
  devis_en_cours: 'Devis en cours',
  devis_accepte: 'Devis accepté',
  en_preparation: 'En préparation',
  en_cours: 'En cours',
  en_pause: 'En pause',
  termine: 'Terminé',
  annule: 'Annulé'
};

const statusColors: Record<project_status, string> = {
  prospect: '#FFC107',
  devis_en_cours: '#FF9800',
  devis_accepte: '#4CAF50',
  en_preparation: '#2196F3',
  en_cours: '#3F51B5',
  en_pause: '#9C27B0',
  termine: '#4CAF50',
  annule: '#F44336'
};

export default function ProjetsScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  
  // Utiliser Reanimated au lieu de Animated
  const translateY = useSharedValue(300);
  
  // Utiliser le projectStore
  const { 
    setProjects, 
    projects, 
    filteredProjects, 
    applyFilters,
    addApplyListener,
    removeApplyListener
  } = useProjectStore();
  
  // Animation avec Reanimated
  const openFilterModal = useCallback(() => {
    setModalVisible(true);
    translateY.value = withTiming(0, { duration: 300 });
  }, [translateY]);
  
  // Fonction séparée pour fermer le modal
  const hideModal = useCallback(() => {
    setModalVisible(false);
  }, []);
  
  const closeFilterModal = useCallback(() => {
    // Utiliser d'abord l'animation, puis cacher le modal à la fin
    translateY.value = withTiming(300, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(hideModal)();
      }
    });
  }, [translateY, hideModal]);
  
  // Style animé pour le modal
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }]
    };
  });
  
  // Fetch des projets
  const { data, loading, error } = useFetch<Project[]>('projects', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
    }
  });

  // Mettre à jour le store quand les données sont chargées
  useEffect(() => {
    if (data) {
      setProjects(data);
    }
  }, [data, setProjects]);
  
  // Écouter l'événement d'application des filtres pour fermer automatiquement le modal
  useEffect(() => {
    const handleApplyFilters = () => {
      closeFilterModal();
    };
    
    // Ajouter l'écouteur d'événement
    if (addApplyListener) {
      addApplyListener(handleApplyFilters);
    }
    
    // Nettoyer l'écouteur à la destruction du composant
    return () => {
      if (removeApplyListener) {
        removeApplyListener(handleApplyFilters);
      }
    };
  }, [closeFilterModal, addApplyListener, removeApplyListener]);

  const navigateToProjectDetail = (projectId: number) => {
    if (projectId) {
      router.navigate({
        pathname: "/projects/[id]",
        params: { id: projectId.toString() }
      });
    }
  };

  // Gestionnaires pour le FAB
  const handleFilterPress = () => {
    openFilterModal();
  };
  
  const handleAddProject = () => {
    // Action pour ajouter un projet
    console.log('Ajouter un projet');
    // Implémentation à venir
  };

  const handleEditProject = () => {
    // Action pour éditer un projet
    console.log('Éditer un projet');
    // Implémentation à venir
  };

  const handleOtherOptions = () => {
    // Autres actions
    console.log('Autres options');
    // Implémentation à venir
  };

  if (loading) {
    return (
      <View className="flex items-center justify-center h-full">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="text-gray-600 mt-4">Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex items-center justify-center h-full">
        <Text className="text-red-500">Erreur: {error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1 px-4 pt-2"
      >
        {filteredProjects && filteredProjects.length > 0 ? (
          filteredProjects.map((projet: Project) => (
            <TouchableOpacity 
              key={projet.id} 
              className="bg-white p-4 rounded-lg shadow-sm mb-4"
              onPress={() => navigateToProjectDetail(projet.id)}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-bold text-lg">{projet.name}</Text>
                  
                  {projet.reference && (
                    <Text className="text-gray-500 text-sm">Ref: {projet.reference}</Text>
                  )}
                </View>
                
                {projet.status && (
                  <View style={{backgroundColor: statusColors[projet.status]}} className="py-1 px-3 rounded-full">
                    <Text className="text-white text-xs font-medium">{statusLabels[projet.status]}</Text>
                  </View>
                )}
              </View>
              
              {projet.description && (
                <Text className="text-gray-600 mt-2" numberOfLines={2}>{projet.description}</Text>
              )}
              
              <View className="flex-row justify-between mt-3 border-t border-gray-100 pt-2">
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text className="text-gray-600 ml-1 text-xs">
                    {projet.start_date ? new Date(projet.start_date).toLocaleDateString('fr-FR') : 'Non défini'}
                    {projet.end_date ? ` → ${new Date(projet.end_date).toLocaleDateString('fr-FR')}` : ''}
                  </Text>
                </View>
                
                <View className="flex-row items-center">
                  <Ionicons name="chevron-forward" size={16} color="#666" />
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="flex items-center justify-center p-8">
            <Ionicons name="construct-outline" size={48} color="#ccc" />
            <Text className="text-gray-500 mt-4 text-center">Aucun projet trouvé</Text>
          </View>
        )}
      </ScrollView>
      
      {/* FAB avec bouton filtre intégré */}
      <ProjectsFab 
        onFilterPress={handleFilterPress}
        onAddPress={handleAddProject}
        onEditPress={handleEditProject}
        onOtherPress={handleOtherOptions}
      />
      
      {/* Modal pour les filtres - version simplifiée avec Reanimated */}
      {modalVisible && (
        <View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end'
          }}
        >
          <TouchableOpacity 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            activeOpacity={1}
            onPress={closeFilterModal}
          />
          <Animated.View 
            style={[
              {
                backgroundColor: 'white',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
                elevation: 10
              },
              animatedStyle
            ]}
          >
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="font-bold text-lg">Filtres</Text>
              <TouchableOpacity onPress={closeFilterModal}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ProjectFilter />
          </Animated.View>
        </View>
      )}
    </View>
  );
}