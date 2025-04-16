import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, BackHandler, Pressable, Platform, Modal, StyleSheet, SafeAreaView, Dimensions, Animated, TextInput } from 'react-native';
import { useFetch } from '../../hooks/useFetch';
import { Project, project_status } from '../../utils/interfaces/project.interface';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
  const slideAnim = useState(new Animated.Value(Dimensions.get('window').height))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  // Utiliser le projectStore
  const { 
    setProjects, 
    projects, 
    filteredProjects, 
    applyFilters,
    addApplyListener,
    removeApplyListener
  } = useProjectStore();
  
  // Gestionnaires simplifiés pour le filtre
  const handleCloseFilter = useCallback(() => {
    // Animer d'abord, puis masquer
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowFilter(false);
    });
  }, [fadeAnim, slideAnim]);
  
  const handleOpenFilter = useCallback(() => {
    setShowFilter(true);
    // Animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);
  
  // Gérer le bouton retour pour fermer le filtre
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showFilter) {
        handleCloseFilter();
        return true;
      }
      return false;
    });
    
    return () => backHandler.remove();
  }, [showFilter, handleCloseFilter]);
  
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
  
  // Écouter l'événement d'application des filtres pour fermer automatiquement le filtre
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
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView 
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}
        contentContainerStyle={{ paddingBottom: 100 }}
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
      
      {/* FAB sans le bouton filtre */}
      <ProjectsFab 
        filtersVisible={showFilter}
        onAddPress={handleAddProject}
        onEditPress={handleEditProject}
        onOtherPress={handleOtherOptions}
      />
      
      {/* Bouton Filtre séparé en bas de l'écran */}
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={handleFilterPress}
      >
        <Ionicons name="options" size={24} color="#fff" />
      </TouchableOpacity>
      
      {/* Panneau de filtre avec animation native */}
      {showFilter && (
        <View style={styles.filterContainer}>
          {/* Overlay pour fermer en touchant en dehors */}
          <Animated.View 
            style={[styles.overlay, { opacity: fadeAnim }]}
          >
            <TouchableOpacity
              style={{ width: '100%', height: '100%' }}
              activeOpacity={1}
              onPress={handleCloseFilter}
            />
          </Animated.View>
          
          {/* Panneau de filtre */}
          <Animated.View 
            style={[
              styles.filterPanel,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Filtres</Text>
                <TouchableOpacity 
                  onPress={handleCloseFilter}
                  style={styles.closeButton}
                  hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <View style={styles.filterContent}>
                <ProjectFilter />
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 999,
  },
  
  filterContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filterPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContent: {
    flex: 1,
  }
});