import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, BackHandler, Pressable, Platform, Modal, StyleSheet } from 'react-native';
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
  const [modalVisible, setModalVisible] = useState(false);
  
  // Utiliser le projectStore
  const { 
    setProjects, 
    projects, 
    filteredProjects, 
    applyFilters,
    addApplyListener,
    removeApplyListener
  } = useProjectStore();
  
  // Gérer le bouton retour pour fermer le modal
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (modalVisible) {
        handleCloseFilter();
        return true;
      }
      return false;
    });
    
    return () => backHandler.remove();
  }, [modalVisible]);
  
  // Gestionnaires simplifiés pour le modal
  const handleOpenFilter = useCallback(() => {
    setModalVisible(true);
  }, []);
  
  const handleCloseFilter = useCallback(() => {
    setModalVisible(false);
  }, []);
  
  // Gestionnaires pour le FAB
  const handleFilterPress = () => {
    handleOpenFilter();
  };
  
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
      handleCloseFilter();
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
  }, [handleCloseFilter, addApplyListener, removeApplyListener]);

  const navigateToProjectDetail = (projectId: number) => {
    if (projectId) {
      router.navigate({
        pathname: "/projects/[id]",
        params: { id: projectId.toString() }
      });
    }
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
      
      {/* Modal de filtre natif */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseFilter}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="font-bold text-lg">Filtres</Text>
              <TouchableOpacity 
                onPress={handleCloseFilter}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ProjectFilter />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%'
  },
  closeButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  }
});