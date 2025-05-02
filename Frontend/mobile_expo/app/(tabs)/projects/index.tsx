import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, BackHandler, Pressable, Platform, Modal, StyleSheet, SafeAreaView, Dimensions, Animated, TextInput, Alert } from 'react-native';
import { useFetch } from '../../hooks/useFetch';
import { Project, project_status } from '../../utils/interfaces/project.interface';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ProjectFilter from '../../components/search/project_filter';
import { useProjectStore } from '../../store/projectStore';
import ProjectsFab from '../../components/FAB/projects/projects.fab';
import AccordionItem from '../../components/documents/AccordionItem';
import { FlashList } from '@shopify/flash-list';

// Étendre l'interface FetchState pour inclure refetch
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

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

const getProjectCountColor = (count: number): string => {
  if (count >= 10) return '#F44336';
  if (count >= 7) return '#FF9800';
  if (count >= 4) return '#4CAF50'; 
  return '#2196F3';                  
};

// Type pour les items de section
type SectionHeaderProps = {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
};

// Types pour la liste aplatie
interface SectionHeaderItem {
  type: 'header';
  id: number;
  sectionId: string;
  title: string;
  count: number;
  isExpanded: boolean;
}

interface ProjectItem extends Project {
  type: 'project';
  sectionId: string;
}

// Type d'union pour les items de la liste
type ProjectListItem = SectionHeaderItem | ProjectItem;

// Type guard pour vérifier le type d'item
function isHeaderItem(item: ProjectListItem): item is SectionHeaderItem {
  return item.type === 'header';
}

// Optimisé avec memo pour éviter les rendus inutiles
const SectionHeader = React.memo(({ title, count, isExpanded, onToggle }: SectionHeaderProps) => {
  const badgeColor = '#3F51B5'; // Couleur fixe indigo
  
  return (
    <TouchableOpacity 
      className="flex-row items-center bg-white rounded-lg p-3 shadow-sm mb-2"
      onPress={onToggle}
    >
      <View style={{ 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: badgeColor,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
      }} className="items-center justify-center mr-3">
        <Text className="font-bold text-white" style={{ fontSize: 16 }}>
          {count}
        </Text>
      </View>
      
      <Text className="flex-1 text-lg font-medium text-gray-800">{title}</Text>
      <Ionicons 
        name={isExpanded ? "chevron-up" : "chevron-down"} 
        size={20} 
        color="#6b7280" 
      />
    </TouchableOpacity>
  );
});

// Composant de projet optimisé avec memo
const ProjectItemComponent = React.memo(({ project, onPress }: { project: Project, onPress: (id: number) => void }) => {
  const handlePress = useCallback(() => {
    onPress(project.id);
  }, [project.id, onPress]);

  return (
    <TouchableOpacity 
      className="bg-white p-4 rounded-xl shadow-md mb-2 active:opacity-70"
      onPress={handlePress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="font-bold text-lg">{project.name}</Text>
          
          {project.reference && (
            <Text className="text-gray-500 text-sm">Ref: {project.reference}</Text>
          )}
        </View>
        
        {project.status && (
          <View style={{backgroundColor: statusColors[project.status]}} className="py-1 px-3 rounded-full">
            <Text className="text-white text-xs font-medium">{statusLabels[project.status]}</Text>
          </View>
        )}
      </View>
      
      {project.description && (
        <Text className="text-gray-600 mt-2" numberOfLines={2}>{project.description}</Text>
      )}
      
      <View className="flex-row justify-between mt-3 border-t border-gray-100 pt-2">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text className="text-gray-600 ml-1 text-xs">
            {project.start_date ? new Date(project.start_date).toLocaleDateString('fr-FR') : 'Non défini'}
            {project.end_date ? ` → ${new Date(project.end_date).toLocaleDateString('fr-FR')}` : ''}
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function ProjetsScreen() {
  const router = useRouter();
  const [showFilter, setShowFilter] = useState(false);
  const slideAnim = useState(new Animated.Value(Dimensions.get('window').height))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [flatListData, setFlatListData] = useState<ProjectListItem[]>([]);
  
  // Utiliser le projectStore
  const { 
    setProjects, 
    projects, 
    filteredProjects, 
    applyFilters,
    addApplyListener,
    removeApplyListener
  } = useProjectStore();
  
  const handleCloseFilter = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: Dimensions.get('window').height, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setShowFilter(false);
    });
  }, [fadeAnim, slideAnim]);
  
  const handleOpenFilter = useCallback(() => {
    setShowFilter(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
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
  
  // Gestionnaire pour le FAB
  const handleFilterPress = useCallback(() => {
    if (showFilter) handleCloseFilter();
    else handleOpenFilter();
  }, [showFilter, handleOpenFilter, handleCloseFilter]);
  
  // Fetch des projets
  const { data, loading, error, refetch } = useFetch<Project[]>('projects', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
    }
  }) as FetchState<Project[]>;

  // Mettre à jour le store quand les données sont chargées
  useEffect(() => {
    if (data) {
      setProjects(data);
    }
  }, [data, setProjects]);
  
  useEffect(() => {
    const handleApplyFilters = () => {
      handleCloseFilter();
    };
    
    if (addApplyListener) {
      addApplyListener(handleApplyFilters);
    }
    
    return () => {
      if (removeApplyListener) {
        removeApplyListener(handleApplyFilters);
      }
    };
  }, [handleCloseFilter, addApplyListener, removeApplyListener]);

  // Formatage du mois et de l'année pour affichage
  const formatMonthYear = useCallback((monthYear: string) => {
    const [month, year] = monthYear.split('/');
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }, []);

  // Gestion du toggle des sections
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Navigation vers détail du projet
  const navigateToProjectDetail = useCallback((projectId: number) => {
    if (projectId) {
      router.navigate({
        pathname: "/projects/[id]",
        params: { id: projectId.toString() }
      });
    }
  }, [router]);

  // Actions du FAB
  const handleAddProject = useCallback(() => {
    Alert.alert(
      'Ajouter un projet',
      'Voulez-vous ajouter un nouveau projet?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'OK', onPress: () => {} }
      ]
    );
  }, []);

  const handleEditProject = useCallback(() => {
    Alert.alert(
      'Éditer un projet',
      'Voulez-vous éditer un projet?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'OK', onPress: () => {} }
      ]
    );
  }, []);

  const handleOtherOptions = useCallback(() => {
    Alert.alert(
      'Autres options',
      'Voici les autres options disponibles',
      [
        { text: 'OK', onPress: () => {} }
      ]
    );
  }, []);

  // Effacer la recherche
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Préparation des données pour FlashList - structure applatie avec sections
  useEffect(() => {
    if (!filteredProjects) {
      setFlatListData([]);
      return;
    }

    // Regrouper les projets par mois/année
    const projectsByMonth: Record<string, Project[]> = {};
    
    for (const project of filteredProjects) {
      const dateReference = project.start_date ? new Date(project.start_date) : new Date();
      const monthYear = `${dateReference.getMonth() + 1}/${dateReference.getFullYear()}`;
      
      if (!projectsByMonth[monthYear]) {
        projectsByMonth[monthYear] = [];
      }
      
      projectsByMonth[monthYear].push(project);
    }
    
    // Trier les mois par ordre chronologique décroissant
    const sortedMonths = Object.keys(projectsByMonth).sort((a, b) => {
      const [monthA, yearA] = a.split('/').map(Number);
      const [monthB, yearB] = b.split('/').map(Number);
      return (yearB - yearA) || (monthB - monthA);
    });
    
    // Générer la liste applatie pour FlashList avec séparateurs de section
    const flattenedData: ProjectListItem[] = [];
    
    sortedMonths.forEach(monthYear => {
      // Ajouter l'en-tête de section
      flattenedData.push({
        type: 'header',
        id: parseInt(monthYear.replace('/', '')), // Générer un ID unique basé sur mois/année
        sectionId: monthYear,
        title: formatMonthYear(monthYear),
        count: projectsByMonth[monthYear].length,
        isExpanded: expandedSections.has(monthYear)
      });
      
      // Si la section est développée, ajouter les projets
      if (expandedSections.has(monthYear)) {
        projectsByMonth[monthYear].forEach(project => {
          flattenedData.push({
            ...project,
            type: 'project',
            sectionId: monthYear
          });
        });
      }
    });
    
    setFlatListData(flattenedData);
  }, [filteredProjects, expandedSections, formatMonthYear]);

  // Rendu optimisé de chaque item (section ou projet)
  const renderItem = useCallback(({ item }: { item: ProjectListItem }) => {
    if (isHeaderItem(item)) {
      return (
        <SectionHeader
          title={item.title}
          count={item.count}
          isExpanded={item.isExpanded}
          onToggle={() => toggleSection(item.sectionId)}
        />
      );
    }
    
    return (
      <ProjectItemComponent 
        project={item}
        onPress={navigateToProjectDetail}
      />
    );
  }, [toggleSection, navigateToProjectDetail]);
  
  // Optimisation: key extractor
  const keyExtractor = useCallback((item: ProjectListItem) => {
    if (isHeaderItem(item)) {
      return `section-${item.sectionId}`;
    }
    return `project-${item.id}`;
  }, []);

  // Pour l'optimisation, calculer une taille estimée
  const estimatedItemSize = useMemo(() => {
    return 100; // Hauteur moyenne estimée en pixels
  }, []);

  // Gestion du chargement et des erreurs
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

      <View style={{ 
        flex: 1, 
        opacity: showFilter ? 0.3 : 1 
      }}>
        {loading && !flatListData.length ? (
          <View className="flex items-center justify-center h-full">
            <ActivityIndicator size="large" color="#0000ff" />
            <Text className="text-gray-600 mt-4">Chargement...</Text>
          </View>
        ) : flatListData.length > 0 ? (
          <FlashList
            data={flatListData}
            renderItem={renderItem}
            estimatedItemSize={estimatedItemSize}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            refreshing={loading}
            onRefresh={refetch}
          />
        ) : (
          <View className="flex items-center justify-center p-8">
            <Ionicons name="construct-outline" size={48} color="#ccc" />
            <Text className="text-gray-500 mt-4 text-center">Aucun projet trouvé</Text>
          </View>
        )}
      </View>
      
      {/* FAB pour les projets */}
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