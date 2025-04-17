import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, BackHandler, Pressable, Platform, Modal, StyleSheet, SafeAreaView, Dimensions, Animated, TextInput, Alert } from 'react-native';
import { useFetch } from '../../hooks/useFetch';
import { Project, project_status } from '../../utils/interfaces/project.interface';
import { useRouter, Stack } from 'expo-router';
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

// Interface pour les props de AccordionItem
interface AccordionItemProps {
  isExpanded: boolean;
  children: React.ReactNode;
  maxHeight?: number;
}

// Composant AccordionItem pour l'animation
function AccordionItem({ isExpanded, children, maxHeight = 1000 }: AccordionItemProps) {
  const [height] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(height, {
      toValue: isExpanded ? maxHeight : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, maxHeight]);

  // Si l'accordéon est déplié, on n'applique pas de hauteur fixe
  if (isExpanded) {
    return (
      <View style={{ height: 'auto' }}>
        {children}
      </View>
    );
  }

  // Si l'accordéon est fermé, on utilise l'animation
  return (
    <Animated.View style={{ height, overflow: 'hidden' }}>
      {children}
    </Animated.View>
  );
}

export default function ProjetsScreen() {
  const router = useRouter();
  const [showFilter, setShowFilter] = useState(false);
  const slideAnim = useState(new Animated.Value(Dimensions.get('window').height))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [projectsByMonth, setProjectsByMonth] = useState<{ [key: string]: Project[] }>({});
  
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
    setShowFilter(!showFilter);
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

  // Regrouper les projets par mois avec useMemo
  const sortedProjectsByMonth = useMemo(() => {
    if (!filteredProjects || filteredProjects.length === 0) return {};
    
    const grouped = filteredProjects.reduce((acc, project) => {
      // Utiliser la date de début comme référence pour le regroupement
      const dateReference = project.start_date ? new Date(project.start_date) : new Date();
      const monthYear = `${dateReference.getMonth() + 1}/${dateReference.getFullYear()}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      
      acc[monthYear].push(project);
      return acc;
    }, {} as { [key: string]: Project[] });
    
    // Trier les mois par ordre chronologique inverse (plus récent d'abord)
    return Object.keys(grouped)
      .sort((a, b) => {
        const [monthA, yearA] = a.split('/').map(Number);
        const [monthB, yearB] = b.split('/').map(Number);
        return (yearB - yearA) || (monthB - monthA);
      })
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {} as { [key: string]: Project[] });
  }, [filteredProjects]);
  
  // Mettre à jour projectsByMonth et expandedSections quand sortedProjectsByMonth change
  useEffect(() => {
    setProjectsByMonth(sortedProjectsByMonth);
    
    // Mettre à jour expandedSections pour conserver l'état d'expansion ou initialiser à false
    setExpandedSections(prevExpandedSections => {
      const newExpandedSections = {} as { [key: string]: boolean };
      
      // Conserver uniquement les clés qui existent dans sortedProjectsByMonth
      Object.keys(sortedProjectsByMonth).forEach(key => {
        newExpandedSections[key] = prevExpandedSections[key] || false;
      });
      
      return newExpandedSections;
    });
  }, [sortedProjectsByMonth]);

  // Formater l'affichage du mois en français
  const formatMonthYear = (monthYear: string) => {
    const [month, year] = monthYear.split('/');
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };
  
  // Toggle l'expansion d'une section
  const toggleSection = (monthYear: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [monthYear]: !prev[monthYear]
    }));
  };

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
    Alert.alert(
      'Ajouter un projet',
      'Voulez-vous ajouter un nouveau projet?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'OK', onPress: () => {} }
      ]
    );
    // Implémentation à venir
  };

  const handleEditProject = () => {
    // Action pour éditer un projet
    Alert.alert(
      'Éditer un projet',
      'Voulez-vous éditer un projet?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'OK', onPress: () => {} }
      ]
    );
    // Implémentation à venir
  };

  const handleOtherOptions = () => {
    // Autres actions
    Alert.alert(
      'Autres options',
      'Voici les autres options disponibles',
      [
        { text: 'OK', onPress: () => {} }
      ]
    );
    // Implémentation à venir
  };

  // Fonction pour effacer la recherche
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  // Rendu d'un élément projet individuel
  const renderProjectItem = (projet: Project) => (
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
  );
  
  // Rendu des sections mensuelles
  const renderMonthSections = () => {
    return Object.entries(projectsByMonth).map(([monthYear, projets]) => (
      <View key={monthYear} className="mb-4">
        <TouchableOpacity 
          className="flex-row items-center bg-white rounded-lg p-3 shadow-sm"
          onPress={() => toggleSection(monthYear)}
        >
          <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
            <Text className="font-bold text-blue-800">{projets.length}</Text>
          </View>
          <Text className="flex-1 text-lg font-medium text-gray-800">{formatMonthYear(monthYear)}</Text>
          <Ionicons 
            name={expandedSections[monthYear] ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#6b7280" 
          />
        </TouchableOpacity>
        
        <AccordionItem isExpanded={expandedSections[monthYear]}>
          <View className="mt-2">
            {projets.map(projet => renderProjectItem(projet))}
          </View>
        </AccordionItem>
      </View>
    ));
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
      <Stack.Screen
        options={{
          title: 'Projets',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />

      <ScrollView 
        style={{ 
          flex: 1, 
          paddingHorizontal: 16, 
          paddingTop: 8,
          opacity: showFilter ? 0.1 : 1 
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {filteredProjects && filteredProjects.length > 0 ? (
          renderMonthSections()
        ) : (
          <View className="flex items-center justify-center p-8">
            <Ionicons name="construct-outline" size={48} color="#ccc" />
            <Text className="text-gray-500 mt-4 text-center">Aucun projet trouvé</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Un seul FAB pour les projets */}
      <ProjectsFab 
        filtersVisible={showFilter}
        onAddPress={handleAddProject}
        onEditPress={handleEditProject}
        onOtherPress={handleOtherOptions}
      />
      
      {/* Barre de recherche et filtres en bas de l'écran */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 shadow-lg">
        {/* Barre de recherche */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 flex-row bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 items-center">
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-gray-800"
              placeholder="Rechercher un projet..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            className="ml-2 bg-indigo-50 p-2 rounded-lg border border-indigo-200"
            onPress={handleFilterPress}
          >
            <MaterialIcons 
              name="filter-list" 
              size={24} 
              color={showFilter ? "#3F51B5" : "#6b7280"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Filtres */}
        {showFilter && (
          <View className="mb-2 bg-gray-50 p-3 rounded-lg">
            <ProjectFilter />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Nous n'avons plus besoin des styles pour le bouton de filtre et le panneau de filtre avec animation
});