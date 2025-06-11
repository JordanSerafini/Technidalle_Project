import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, BackHandler, Pressable, Platform, StyleSheet, SafeAreaView, Dimensions, Animated, TextInput, Alert, Button } from 'react-native';
import { useFetch } from '../../hooks/useFetch';
import { Project, project_status } from '../../utils/interfaces/project.interface';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ProjectFilter from '../../components/search/project_filter';
import { useProjectStore } from '../../store/projectStore';
import ProjectsFab from '../../components/FAB/projects/projects.fab';
import { FlashList } from '@shopify/flash-list';
import AddProjectModal from '../../components/projects/add_project/addProjectsModal';
import { formatTextForDisplay } from '../../utils/textUtils';

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
  const badgeColor = getProjectCountColor(count);
  
  return (
    <TouchableOpacity 
      className="flex-row items-center bg-white rounded-xl p-4 shadow-sm mb-3 border border-gray-100"
      onPress={onToggle}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
      }}
    >
      <View style={{ 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        backgroundColor: badgeColor,
        shadowColor: badgeColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
      }} className="items-center justify-center mr-4">
        <Text className="font-bold text-white" style={{ fontSize: 16 }}>
          {count}
        </Text>
      </View>
      
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-900">{title}</Text>
        <Text className="text-sm text-gray-500 mt-0.5">
          {count} projet{count > 1 ? 's' : ''} {isExpanded ? 'affichés' : 'masqués'}
        </Text>
      </View>
      
      <View className="bg-gray-50 p-2 rounded-full">
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6B7280" 
        />
      </View>
    </TouchableOpacity>
  );
});

// Composant de projet optimisé avec memo
const ProjectItemComponent = React.memo(({ project, onPress }: { project: Project, onPress: (id: number) => void }) => {
  const handlePress = useCallback(() => {
    onPress(project.id);
  }, [project.id, onPress]);

  // Calculer les jours depuis la création/début
  const daysSinceStart = useMemo(() => {
    const referenceDate = project.start_date ? new Date(project.start_date) : new Date(project.created_at || new Date());
    const now = new Date();
    const diffTime = now.getTime() - referenceDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [project.start_date, project.created_at]);

  return (
    <TouchableOpacity 
      className="bg-white p-4 rounded-xl shadow-sm mb-2 active:opacity-70 border border-gray-100"
      onPress={handlePress}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <Text className="font-bold text-lg text-gray-900" numberOfLines={1}>
            {project.name}
          </Text>
          
          <View className="flex-row items-center mt-1">
            {project.reference && (
              <View className="bg-gray-100 px-2 py-1 rounded-md mr-2">
                <Text className="text-gray-600 text-xs font-medium">#{project.reference}</Text>
              </View>
            )}
            {daysSinceStart >= 0 && daysSinceStart <= 7 && (
              <View className="bg-green-100 px-2 py-1 rounded-md">
                <Text className="text-green-700 text-xs font-medium">Récent</Text>
              </View>
            )}
          </View>
        </View>
        
        {project.status && (
          <View style={{backgroundColor: statusColors[project.status]}} className="py-1.5 px-3 rounded-full">
            <Text className="text-white text-xs font-semibold">{statusLabels[project.status]}</Text>
          </View>
        )}
      </View>
      
      {project.description && (
        <Text className="text-gray-600 mt-3 leading-5" numberOfLines={2}>
          {formatTextForDisplay(project.description, 120)}
        </Text>
      )}
      
      <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-50">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text className="text-gray-500 ml-2 text-sm">
            {project.start_date ? new Date(project.start_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }) : 'Date non définie'}
          </Text>
          {project.end_date && (
            <>
              <Ionicons name="arrow-forward" size={12} color="#6B7280" className="mx-2" />
              <Text className="text-gray-500 text-sm">
                {new Date(project.end_date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short'
                })}
              </Text>
            </>
          )}
        </View>
        
        <View className="flex-row items-center">
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
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
  const [isDefaultFilter, setIsDefaultFilter] = useState(true); // Nouveau state pour gérer le filtre par défaut
  
  // SIMPLIFIÉ: État pour la modale de création de projet
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  
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

  // Fonction pour appliquer le filtre par défaut (mois courant ou 20 derniers)
  const applyDefaultFilter = useCallback((projectsData: Project[]) => {
    if (!projectsData || projectsData.length === 0) return [];

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Filtrer les projets du mois courant
    const currentMonthProjects = projectsData.filter(project => {
      if (!project.start_date) return false;
      const startDate = new Date(project.start_date);
      return startDate >= currentMonthStart && startDate <= currentMonthEnd;
    });

    // Si on a au moins 5 projets du mois courant, les retourner
    if (currentMonthProjects.length >= 5) {
      return currentMonthProjects.sort((a, b) => {
        const dateA = new Date(a.start_date || a.created_at || 0);
        const dateB = new Date(b.start_date || b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      });
    }

    // Sinon, retourner les 20 derniers projets par date
    return [...projectsData]
      .sort((a, b) => {
        const dateA = new Date(a.start_date || a.created_at || 0);
        const dateB = new Date(b.start_date || b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 20);
  }, []);

  // Mettre à jour le store quand les données sont chargées avec filtre par défaut
  useEffect(() => {
    if (data && isDefaultFilter) {
      const defaultFilteredData = applyDefaultFilter(data);
      setProjects(defaultFilteredData);
      
      // Développer automatiquement le mois le plus récent
      if (defaultFilteredData.length > 0) {
        const mostRecentProject = defaultFilteredData[0];
        const dateReference = mostRecentProject.start_date ? new Date(mostRecentProject.start_date) : new Date();
        const monthYear = `${dateReference.getMonth() + 1}/${dateReference.getFullYear()}`;
        setExpandedSections(new Set([monthYear]));
      }
    } else if (data && !isDefaultFilter) {
      setProjects(data);
    }
  }, [data, setProjects, applyDefaultFilter, isDefaultFilter]);
  
  useEffect(() => {
    const handleApplyFilters = () => {
      handleCloseFilter();
      // Désactiver le filtre par défaut quand on utilise les filtres avancés
      setIsDefaultFilter(false);
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

  // Gestion de la recherche en temps réel
  const searchFilteredProjects = useMemo(() => {
    if (!filteredProjects) return [];
    
    if (!searchQuery.trim()) return filteredProjects;
    
    const query = searchQuery.toLowerCase();
    return filteredProjects.filter(project => 
      project.name?.toLowerCase().includes(query) ||
      project.reference?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  }, [filteredProjects, searchQuery]);

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

  // NOUVELLES FONCTIONS pour la modale
  const openAddModal = useCallback(() => {
    setAddModalVisible(true);
  }, []);
  
  const closeAddModal = useCallback(() => {
    setAddModalVisible(false);
  }, []);
  
  const handleCreateProject = useCallback((projectData: any) => {
    console.log("Données reçues:", projectData);
    
    // Validation basique (compatible avec les deux formats)
    if (!projectData.name || !(projectData.clientId || projectData.client_id)) {
      Alert.alert("Champs requis", "Le nom et le client sont obligatoires.");
      return;
    }
    
    // Afficher un indicateur de chargement
    setState(prev => ({ ...prev, isSubmitting: true }));
    
    // Appel API pour créer le projet
    fetch('http://192.168.20.225:3000/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(projectData)
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          console.error("Erreur API:", response.status, text);
          throw new Error(`Erreur: ${response.status} - ${text}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log("Projet créé avec succès:", data);
      
      // Ajouter le nouveau projet à la liste locale
      if (data && setProjects && projects) {
        setProjects([...projects, data]);
      }
      
      // Masquer l'indicateur de chargement
      setState(prev => ({ ...prev, isSubmitting: false }));
      
      Alert.alert(
        "Création projet",
        `Projet "${projectData.name}" créé avec succès!`,
        [{ text: "OK", onPress: () => { 
          closeAddModal();
          // Recharger la liste après création
          if (refetch) refetch();
        }}]
      );
    })
    .catch(error => {
      console.error("Erreur de création:", error);
      
      // Masquer l'indicateur de chargement
      setState(prev => ({ ...prev, isSubmitting: false }));
      
      Alert.alert(
        "Erreur",
        `Impossible de créer le projet: ${error.message}`,
        [{ text: "OK" }]
      );
    });
  }, [closeAddModal, refetch, setProjects, projects]);
  
  // État local pour la gestion des chargements et autres états d'UI
  const [state, setState] = useState({
    isSubmitting: false,
  });
  
  // Mise à jour des fonctions du FAB
  const handleAddProject = useCallback(() => {
    openAddModal();
  }, [openAddModal]);

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
    if (!searchFilteredProjects) {
      setFlatListData([]);
      return;
    }

    // Regrouper les projets par mois/année
    const projectsByMonth: Record<string, Project[]> = {};
    
    for (const project of searchFilteredProjects) {
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
  }, [searchFilteredProjects, expandedSections, formatMonthYear]);

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

  // Gestionnaire pour activer/désactiver le filtre par défaut
  const toggleDefaultFilter = useCallback(() => {
    setIsDefaultFilter(prev => {
      const newValue = !prev;
      if (newValue && data) {
        // Réappliquer le filtre par défaut
        const defaultFilteredData = applyDefaultFilter(data);
        setProjects(defaultFilteredData);
      } else if (!newValue && data) {
        // Afficher tous les projets
        setProjects(data);
      }
      return newValue;
    });
  }, [data, applyDefaultFilter, setProjects]);

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
          title: `Projets${searchFilteredProjects ? ` (${searchFilteredProjects.length})` : ''}`,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <View className="flex-row items-center">
              {isDefaultFilter && (
                <View className="bg-blue-100 px-2 py-1 rounded-full mr-2">
                  <Text className="text-blue-700 text-xs font-medium">Récents</Text>
                </View>
              )}
              <TouchableOpacity onPress={refetch} className="p-1">
                <Ionicons name="refresh" size={20} color="#3F51B5" />
              </TouchableOpacity>
            </View>
          ),
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
            <Ionicons name="construct-outline" size={64} color="#ccc" />
            <Text className="text-gray-500 mt-4 text-center text-lg font-medium">
              {searchQuery ? 'Aucun projet trouvé' : 'Aucun projet disponible'}
            </Text>
            {searchQuery && (
              <Text className="text-gray-400 mt-2 text-center text-sm">
                Essayez de modifier votre recherche ou vos filtres
              </Text>
            )}
            {!searchQuery && !isDefaultFilter && (
              <TouchableOpacity 
                onPress={toggleDefaultFilter}
                className="mt-4 bg-blue-50 px-4 py-2 rounded-full border border-blue-200"
              >
                <Text className="text-blue-700 font-medium">Voir les projets récents</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      
      {/* FAB pour les projets */}
      <ProjectsFab 
        filtersVisible={showFilter}
        onAddPress={openAddModal}
        onEditPress={handleEditProject}
        onOtherPress={handleOtherOptions}
      />
      
      {/* Barre de recherche et filtres en bas de l'écran */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 shadow-lg">
        {/* Indicateur de filtre actif */}
        {isDefaultFilter && (
          <View className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="funnel" size={16} color="#3B82F6" />
                <Text className="text-blue-700 text-sm ml-2 font-medium">
                  Projets récents (mois courant ou 20 derniers)
                </Text>
              </View>
              <TouchableOpacity 
                onPress={toggleDefaultFilter}
                className="bg-blue-100 px-3 py-1 rounded-full"
              >
                <Text className="text-blue-700 text-xs font-medium">Voir tout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
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
          
          {!isDefaultFilter && (
            <TouchableOpacity 
              className="ml-2 bg-blue-50 p-2 rounded-lg border border-blue-200"
              onPress={toggleDefaultFilter}
            >
              <Ionicons 
                name="time" 
                size={20} 
                color="#3B82F6" 
              />
            </TouchableOpacity>
          )}
          
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
      
      {/* Utiliser le nouveau composant de modale */}
      <AddProjectModal
        visible={isAddModalVisible}
        onClose={closeAddModal}
        onCreateProject={handleCreateProject}
      />
    </View>
  );
}

// Le StyleSheet peut être épuré car les styles de la modale sont maintenant dans le composant AddProjectModal
const styles = StyleSheet.create({
  // ... autres styles nécessaires ...
});

