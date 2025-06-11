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
import { LinearGradient } from 'expo-linear-gradient';

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

const statusColors: Record<project_status, { bg: string; text: string; border: string }> = {
  prospect: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  devis_en_cours: { bg: '#FED7AA', text: '#C2410C', border: '#F97316' },
  devis_accepte: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
  en_preparation: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
  en_cours: { bg: '#E0E7FF', text: '#3730A3', border: '#6366F1' },
  en_pause: { bg: '#F3E8FF', text: '#7C2D12', border: '#A855F7' },
  termine: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
  annule: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' }
};

const getProjectCountColor = (count: number): string => {
  if (count >= 15) return '#EF4444'; // Red
  if (count >= 10) return '#F97316'; // Orange  
  if (count >= 5) return '#3B82F6';  // Blue
  return '#10B981';                  // Green
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

// Header de section style documents
const SectionHeader = React.memo(({ title, count, isExpanded, onToggle }: SectionHeaderProps) => {
  const primaryColor = getProjectCountColor(count);
  
  return (
    <TouchableOpacity 
      onPress={onToggle}
      style={styles.sectionHeader}
    >
      <LinearGradient
        colors={['#E2E8F0', '#CBD5E1']}
        style={styles.sectionGradient}
      >
        <View style={styles.sectionIcon}>
          <Ionicons name="briefcase-outline" size={22} color={primaryColor} />
        </View>
        
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        
        <View style={[styles.countBadge, { backgroundColor: primaryColor }]}>
          <Text style={styles.countText}>{count}</Text>
        </View>
        
        <View style={styles.expandIcon}>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#64748B" 
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

// Carte de projet moderne avec design SaaS
const ProjectItemComponent = React.memo(({ project, onPress }: { project: Project, onPress: (id: number) => void }) => {
  const handlePress = useCallback(() => {
    onPress(project.id);
  }, [project.id, onPress]);

  const statusConfig = project.status ? statusColors[project.status] : null;
  
  // Calculer les jours depuis la création/début
  const daysSinceStart = useMemo(() => {
    const referenceDate = project.start_date ? new Date(project.start_date) : new Date(project.created_at || new Date());
    const now = new Date();
    const diffTime = now.getTime() - referenceDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [project.start_date, project.created_at]);

  const isNew = daysSinceStart >= 0 && daysSinceStart <= 7;

  return (
    <TouchableOpacity 
      onPress={handlePress}
      style={styles.projectCard}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.projectGradient}
      >
        {/* En-tête du projet */}
        <View style={styles.projectHeader}>
          <View style={styles.projectTitleContainer}>
            <Text style={styles.projectTitle} numberOfLines={1}>
              {project.name}
            </Text>
            <View style={styles.projectMeta}>
              {project.reference && (
                <View style={styles.referenceTag}>
                  <Text style={styles.referenceText}>#{project.reference}</Text>
                </View>
              )}
              {isNew && (
                <View style={styles.newTag}>
                  <Text style={styles.newTagText}>Nouveau</Text>
                </View>
              )}
            </View>
          </View>
          
          {statusConfig && (
            <View style={[styles.statusBadge, { 
              backgroundColor: statusConfig.bg,
              borderColor: statusConfig.border 
            }]}>
              <Text style={[styles.statusText, { color: statusConfig.text }]}>
                {statusLabels[project.status!]}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        {project.description && (
          <Text style={styles.projectDescription} numberOfLines={2}>
            {formatTextForDisplay(project.description, 120)}
          </Text>
        )}

        {/* Footer avec dates */}
        <View style={styles.projectFooter}>
          <View style={styles.dateInfo}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.dateText}>
              {project.start_date ? new Date(project.start_date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
              }) : 'Date non définie'}
            </Text>
            {project.end_date && (
              <>
                <View style={styles.dateSeparator} />
                <Text style={styles.dateText}>
                  {new Date(project.end_date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short'
                  })}
                </Text>
              </>
            )}
          </View>
          
          <View style={styles.actionIcon}>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </View>
      </LinearGradient>
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
  const [isDefaultFilter, setIsDefaultFilter] = useState(true);
  
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
      <View style={styles.projectListUnderBanner}>
        <ProjectItemComponent 
          project={item}
          onPress={navigateToProjectDetail}
        />
      </View>
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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `Projets${searchFilteredProjects ? ` (${searchFilteredProjects.length})` : ''}`,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerRight: () => (
            <View style={styles.headerRight}>
              {isDefaultFilter && (
                <View style={styles.recentBadge}>
                  <Text style={styles.recentBadgeText}>Récents</Text>
                </View>
              )}
              <TouchableOpacity onPress={refetch} style={styles.refreshButton}>
                <Ionicons name="refresh" size={20} color="#3B82F6" />
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
      
      {/* Barre de recherche et filtres moderne */}
      <View style={styles.searchContainer}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.searchGradient}
        >
          {/* Indicateur de filtre actif */}
          {isDefaultFilter && (
            <View style={styles.filterIndicator}>
              <View style={styles.filterIndicatorContent}>
                <View style={styles.filterIndicatorLeft}>
                  <Ionicons name="funnel" size={16} color="#3B82F6" />
                  <Text style={styles.filterIndicatorText}>
                    Projets récents (mois courant ou 20 derniers)
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={toggleDefaultFilter}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllButtonText}>Voir tout</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Barre de recherche */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un projet..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>
            
            {!isDefaultFilter && (
              <TouchableOpacity 
                style={styles.timeFilterButton}
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
              style={[styles.filterButton, showFilter && styles.filterButtonActive]}
              onPress={handleFilterPress}
            >
              <MaterialIcons 
                name="filter-list" 
                size={24} 
                color={showFilter ? "#3B82F6" : "#64748B"} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Filtres */}
          {showFilter && (
            <View style={styles.filtersContainer}>
              <ProjectFilter />
            </View>
          )}
        </LinearGradient>
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

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header Styles
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentBadgeText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 4,
  },
  
  // Section Header Styles (style documents)
  sectionHeader: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 0,
    width: '100%',
  },
  sectionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    marginRight: 16,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  expandIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  
  // Project Card Styles (style documents)
  projectCard: {
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  projectGradient: {
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  projectTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  referenceTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  referenceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  newTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  newTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  projectDescription: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 16,
  },
  projectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  dateSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  actionIcon: {
    padding: 4,
  },
  
  // Search Container Styles
  searchContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  searchGradient: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  
  // Filter Indicator Styles
  filterIndicator: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  filterIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterIndicatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterIndicatorText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  viewAllButton: {
    backgroundColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewAllButtonText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Search Row Styles
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1E293B',
  },
  clearButton: {
    padding: 4,
  },
  timeFilterButton: {
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  filterButton: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterButtonActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  filtersContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  projectListUnderBanner: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
});

