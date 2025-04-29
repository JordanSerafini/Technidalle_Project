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
  
  const handleCloseFilter = useCallback(() => {
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

  const sortedProjectsByMonth = useMemo(() => {
    if (!filteredProjects || filteredProjects.length === 0) return {};
    
    const grouped = filteredProjects.reduce((acc, project) => {
      const dateReference = project.start_date ? new Date(project.start_date) : new Date();
      const monthYear = `${dateReference.getMonth() + 1}/${dateReference.getFullYear()}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      
      acc[monthYear].push(project);
      return acc;
    }, {} as { [key: string]: Project[] });
    
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
  
  useEffect(() => {
    setProjectsByMonth(sortedProjectsByMonth);
    
    setExpandedSections(prevExpandedSections => {
      const newExpandedSections = {} as { [key: string]: boolean };
      
      Object.keys(sortedProjectsByMonth).forEach(key => {
        newExpandedSections[key] = prevExpandedSections[key] || false;
      });
      
      return newExpandedSections;
    });
  }, [sortedProjectsByMonth]);

  const formatMonthYear = (monthYear: string) => {
    const [month, year] = monthYear.split('/');
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };
  
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
  };

  const handleEditProject = () => {
    Alert.alert(
      'Éditer un projet',
      'Voulez-vous éditer un projet?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'OK', onPress: () => {} }
      ]
    );
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
  };

  const clearSearch = () => {
    setSearchQuery('');
  };
  
  const renderProjectItem = (projet: Project) => (
    <TouchableOpacity 
      key={projet.id} 
      className="bg-white p-4 rounded-xl shadow-md mb-5 active:opacity-70"      onPress={() => navigateToProjectDetail(projet.id)}
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
  
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Fonction pour formater l'affichage de la semaine
  const formatWeek = (weekNum: number, year: number, projectCount: number): string => {
    // Calculer la date du premier jour de la semaine (lundi)
    const firstDayOfYear = new Date(year, 0, 1);
    const dayOffset = firstDayOfYear.getDay() === 0 ? 7 : firstDayOfYear.getDay();
    const dayOfYear = (weekNum * 7) - (7 - (dayOffset - 1));
    
    // Date de début (lundi de la semaine)
    const startDate = new Date(year, 0, dayOfYear);
    
    // Date de fin (dimanche de la semaine)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    // Formater les dates en DD/MM/YYYY
    const formatDate = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    return `du ${formatDate(startDate)} au ${formatDate(endDate)}`;
  };

  const groupProjectsByWeek = (projects: Project[]): { [key: string]: Project[] } => {
    const grouped: { [key: string]: Project[] } = {};

    if (projects.length > 5) {
      projects.forEach(project => {
        const date = project.start_date ? new Date(project.start_date) : new Date();
        const weekNum = getWeekNumber(date);
        const year = date.getFullYear();
        const weekKey = `${weekNum}-${year}`;
        
        if (!grouped[weekKey]) {
          grouped[weekKey] = [];
        }
        
        grouped[weekKey].push(project);
      });
      
      // Trier les semaines par ordre chronologique 
      return Object.keys(grouped)
        .sort((a, b) => {
          const [weekA, yearA] = a.split('-').map(Number);
          const [weekB, yearB] = b.split('-').map(Number);
          return (yearB - yearA) || (weekA - weekB);
        })
        .reduce((acc, key) => {
          acc[key] = grouped[key];
          return acc;
        }, {} as { [key: string]: Project[] });
    } else {
      grouped["all"] = projects;
      return grouped;
    }
  };
  
  // État pour suivre les sous-sections développées
  const [expandedWeeks, setExpandedWeeks] = useState<{ [key: string]: boolean }>({});
  
  // Toggle l'expansion d'une sous-section semaine
  const toggleWeekSection = (weekKey: string) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekKey]: !prev[weekKey]
    }));
  };

  // Rendu des sections mensuelles
  const renderMonthSections = () => {
    return Object.entries(projectsByMonth).map(([monthYear, projets]) => {
      // Utiliser une couleur fixe pour tous les badges
      const badgeColor = '#3F51B5'; // Couleur fixe (indigo)
      
      return (
        <View key={monthYear} className="mb-4">
          <TouchableOpacity 
            className="flex-row items-center bg-white rounded-lg p-3 shadow-sm"
            onPress={() => toggleSection(monthYear)}
          >
            {/* Badge stylisé pour le nombre de projets */}
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
                {projets.length}
              </Text>
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
              {/* Regrouper par semaine si beaucoup de projets */}
              {(() => {
                const projectsByWeek = groupProjectsByWeek(projets);
                
                return Object.entries(projectsByWeek).map(([weekKey, weekProjects]) => {
                  // Si c'est le groupe "all", on affiche directement les projets
                  if (weekKey === "all") {
                    return weekProjects.map(projet => renderProjectItem(projet));
                  }
                  
                  // Sinon, on crée un sous-accordéon par semaine
                  const [weekNum, year] = weekKey.split('-').map(Number);
                  
                  return (
                    <View key={weekKey} className="mb-3">
                      <TouchableOpacity 
                        className="flex-row items-center bg-gray-100 rounded-lg p-2 mb-2"
                        onPress={() => toggleWeekSection(weekKey)}
                      >
                        <Text className="flex-1 text-md font-medium text-gray-700">
                          {formatWeek(weekNum, year, weekProjects.length)} <Text className="text-gray-500 text-sm">({weekProjects.length})</Text>
                        </Text>
                        <Ionicons 
                          name={expandedWeeks[weekKey] ? "chevron-up" : "chevron-down"} 
                          size={18} 
                          color="#6b7280" 
                        />
                      </TouchableOpacity>
                      
                      <AccordionItem isExpanded={expandedWeeks[weekKey] ?? false}>
                        <View>
                          {weekProjects.map(projet => renderProjectItem(projet))}
                        </View>
                      </AccordionItem>
                    </View>
                  );
                });
              })()}
            </View>
          </AccordionItem>
        </View>
      );
    });
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