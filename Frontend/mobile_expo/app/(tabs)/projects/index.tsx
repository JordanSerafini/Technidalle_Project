import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Animated } from 'react-native';
import { useFetch } from '../../hooks/useFetch';
import { Project, project_status } from '../../utils/interfaces/project.interface';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProjectFilter from '../../components/search/project_filter';
import { useProjectStore } from '../../store/projectStore';
import ProjectsFab from '../../components/FAB/projects/projects.fab';

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
  const [showFilter, setShowFilter] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Simplifier l'animation pour éviter les plantages sur mobile
  const slideAnimation = useRef(new Animated.Value(300)).current;
  
  // Utiliser le projectStore
  const { 
    setProjects, 
    projects, 
    filteredProjects, 
    applyFilters,
    addApplyListener,
    removeApplyListener
  } = useProjectStore();
  
  // Simplification de l'ouverture du modal
  const openFilterModal = useCallback(() => {
    setModalVisible(true);
    
    // Animation plus simple
    Animated.spring(slideAnimation, {
      toValue: 0,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [slideAnimation]);
  
  // Simplification de la fermeture du modal
  const closeFilterModal = useCallback(() => {
    // Animation de fermeture plus simple
    Animated.timing(slideAnimation, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  }, [slideAnimation]);
  
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
      
      {/* Bouton de filtre flottant (déplacé à gauche) */}
      <TouchableOpacity 
        onPress={openFilterModal}
        className="absolute bottom-6 left-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="settings" size={24} color="#fff" />
      </TouchableOpacity>
      
      {/* FAB à droite */}
      <ProjectsFab 
        onAddPress={handleAddProject}
        onEditPress={handleEditProject}
        onOtherPress={handleOtherOptions}
      />
      
      {/* Modal pour les filtres (simplifié) */}
      <Modal
        animationType="fade"  
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeFilterModal}
      >
        <TouchableOpacity 
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}
          activeOpacity={1}
          onPress={closeFilterModal}
        >
          <Animated.View 
            style={{
              transform: [{ translateY: slideAnimation }],
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 10
            }}
          >
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="font-bold text-lg">Filtres</Text>
              <TouchableOpacity onPress={closeFilterModal}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ProjectFilter />
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}