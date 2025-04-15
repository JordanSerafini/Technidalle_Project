import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, BackHandler, Pressable, Platform } from 'react-native';
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
  withSpring,
  runOnJS,
  Easing
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
  
  // Valeurs animées pour le modal
  const translateY = useSharedValue(1000);
  const opacity = useSharedValue(0);
  
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
  
  // Animation d'ouverture pour mobile et web (plus rapide)
  const handleOpenFilter = useCallback(() => {
    // D'abord afficher le modal
    setModalVisible(true);
    
    // Puis lancer les animations (plus rapides)
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 120 }); // Réduit de 200ms à 120ms
      translateY.value = withSpring(0, {
        damping: 15,
        mass: 0.6, // Masse réduite pour une animation plus rapide
        stiffness: 180 // Ressort plus raide pour une montée plus rapide
      });
    }, 10);
  }, [opacity, translateY]);
  
  // Fermeture immédiate et définitive
  const handleCloseFilter = useCallback(() => {
    // Fermeture immédiate
    setModalVisible(false);
    
    // Reset les valeurs pour la prochaine ouverture
    translateY.value = 1000;
    opacity.value = 0;
  }, [translateY, opacity]);
  
  // Styles animés pour l'overlay et le modal
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));
  
  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));
  
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
      
      {/* Modal de filtre avec animation accélérée */}
      {modalVisible && (
        <View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
          }}
        >
          {/* Overlay avec opacité animée */}
          <Animated.View
            style={[{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
            }, overlayStyle]}
          >
            <TouchableOpacity 
              style={{ width: '100%', height: '100%' }}
              activeOpacity={0.7}
              onPress={handleCloseFilter}
            />
          </Animated.View>
          
          {/* Contenu avec translation animée */}
          <Animated.View 
            style={[{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderTopLeftRadius: 24, 
              borderTopRightRadius: 24,
              paddingBottom: Platform.OS === 'ios' ? 40 : 20,
              maxHeight: '90%',
              zIndex: 1001,
            }, modalStyle]}
          >
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="font-bold text-lg">Filtres</Text>
              <TouchableOpacity 
                onPress={handleCloseFilter}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                style={{ 
                  padding: 10,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
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