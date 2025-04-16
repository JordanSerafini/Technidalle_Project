import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView, TextInput, ViewStyle, Animated, ScrollView, PanResponder } from "react-native";
import { useRouter, Stack, Link } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFetch } from '@/app/hooks/useFetch';
import { Document, DocumentType, DocumentStatus } from '@/app/utils/interfaces/document';
import { formatDate } from '@/app/utils/dateFormatter';
import DocumentsFAB from '@/app/components/FAB/documents/documents.fab';
import DocumentsModal from '@/app/components/modals/documents/addDocuments.modal';

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

// Types de filtres disponibles
enum FilterType {
  TYPE = 'type',
  STATUS = 'status',
  DATE = 'date'
}

export default function DocumentsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [documentsByMonth, setDocumentsByMonth] = useState<{ [key: string]: Document[] }>({});
  const [currentFilter, setCurrentFilter] = useState<FilterType>(FilterType.TYPE);
  
  // État de la modale de document
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [modalProjectId, setModalProjectId] = useState<number | undefined>(undefined);
  const [modalClientId, setModalClientId] = useState<number | undefined>(undefined);
  
  // Animation pour le swipe entre filtres
  const [filterPosition] = useState(new Animated.Value(0));
  
  // Pan Responder pour la gestion du swipe
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (filterVisible) {
          filterPosition.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (filterVisible) {
          if (gestureState.dx > 50) {
            // Swipe droite - filtre précédent
            switchToPrevFilter();
          } else if (gestureState.dx < -50) {
            // Swipe gauche - filtre suivant
            switchToNextFilter();
          }
          
          // Reset de la position
          Animated.spring(filterPosition, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;
  
  // Référence pour éviter les re-rendus en boucle
  const hasGroupedDocuments = useRef(false);
  
  // Récupération des documents
  const { data: documents, loading, error } = useFetch<Document[]>('documents', {
    searchQuery: searchQuery.length > 0 ? searchQuery : undefined
  });
  
  // Reset hasGroupedDocuments when filters change to force regrouping
  useEffect(() => {
    hasGroupedDocuments.current = false;
  }, [selectedType, selectedStatus, selectedDateFilter]);
  
  // Fonction pour passer au filtre suivant
  const switchToNextFilter = () => {
    switch (currentFilter) {
      case FilterType.TYPE:
        setCurrentFilter(FilterType.STATUS);
        break;
      case FilterType.STATUS:
        setCurrentFilter(FilterType.DATE);
        break;
      case FilterType.DATE:
        setCurrentFilter(FilterType.TYPE);
        break;
    }
  };
  
  // Fonction pour passer au filtre précédent
  const switchToPrevFilter = () => {
    switch (currentFilter) {
      case FilterType.TYPE:
        setCurrentFilter(FilterType.DATE);
        break;
      case FilterType.STATUS:
        setCurrentFilter(FilterType.TYPE);
        break;
      case FilterType.DATE:
        setCurrentFilter(FilterType.STATUS);
        break;
    }
  };
  
  // Filtrer les documents selon les critères sélectionnés avec useMemo pour éviter les recalculs inutiles
  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    
    return documents.filter(doc => {
      // Filtre par type
      const typeMatch = selectedType ? doc.type === selectedType : true;
      
      // Filtre par statut
      const statusMatch = selectedStatus ? 
        // Vérifier si le statut existe avant de comparer
        doc.status && doc.status === selectedStatus : true;
      
      // Filtre par date
      let dateMatch = true;
      if (selectedDateFilter) {
        const today = new Date();
        const docDate = new Date(doc.issue_date);
        
        switch (selectedDateFilter) {
          case 'today':
            dateMatch = docDate.toDateString() === today.toDateString();
            break;
          case 'week':
            const weekAgo = new Date();
            weekAgo.setDate(today.getDate() - 7);
            dateMatch = docDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date();
            monthAgo.setMonth(today.getMonth() - 1);
            dateMatch = docDate >= monthAgo;
            break;
          case 'year':
            const yearAgo = new Date();
            yearAgo.setFullYear(today.getFullYear() - 1);
            dateMatch = docDate >= yearAgo;
            break;
        }
      }
      
      return typeMatch && statusMatch && dateMatch;
    });
  }, [documents, selectedType, selectedStatus, selectedDateFilter]);
  
  // Regrouper les documents par mois avec useMemo
  const sortedDocumentsByMonth = useMemo(() => {
    if (!filteredDocuments.length) return {};
    
    const grouped = filteredDocuments.reduce((acc, doc) => {
      const date = new Date(doc.issue_date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(doc);
      return acc;
    }, {} as { [key: string]: Document[] });
    
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
      }, {} as { [key: string]: Document[] });
  }, [filteredDocuments]);
  
  // Mettre à jour documentsByMonth et expandedSections quand sortedDocumentsByMonth change
  useEffect(() => {
    setDocumentsByMonth(sortedDocumentsByMonth);
    
    // Mettre à jour expandedSections pour conserver l'état d'expansion ou initialiser à false
    setExpandedSections(prevExpandedSections => {
      const newExpandedSections = {} as { [key: string]: boolean };
      
      // Conserver uniquement les clés qui existent dans sortedDocumentsByMonth
      Object.keys(sortedDocumentsByMonth).forEach(key => {
        newExpandedSections[key] = prevExpandedSections[key] || false;
      });
      
      return newExpandedSections;
    });
  }, [sortedDocumentsByMonth]);
  
  // Obtenir le nom de l'icône selon le type
  const getIconForType = (type: DocumentType) => {
    switch (type) {
      case DocumentType.DEVIS: return 'description';
      case DocumentType.FACTURE: return 'receipt';
      case DocumentType.BON_DE_COMMANDE: return 'shopping-cart';
      case DocumentType.BON_DE_LIVRAISON: return 'local-shipping';
      case DocumentType.FICHE_TECHNIQUE: return 'article';
      case DocumentType.PHOTO_CHANTIER: return 'photo-camera';
      case DocumentType.PLAN: return 'map';
      default: return 'insert-drive-file';
    }
  };
  
  // Fonction pour naviguer vers les détails d'un document
  const navigateToDocument = (id: number) => {
    // @ts-ignore - Ignorer les erreurs de typage pour contourner le problème
    router.push(`/(tabs)/documents/${id}`);
  };
  
  // Types de documents pour le filtre
  const documentTypes: DocumentType[] = [
    DocumentType.DEVIS,
    DocumentType.FACTURE,
    DocumentType.BON_DE_COMMANDE,
    DocumentType.BON_DE_LIVRAISON,
    DocumentType.FICHE_TECHNIQUE,
    DocumentType.PHOTO_CHANTIER,
    DocumentType.PLAN,
    DocumentType.AUTRE
  ];
  
  // Statuts de documents pour le filtre
  const documentStatuses: DocumentStatus[] = [
    DocumentStatus.BROUILLON,
    DocumentStatus.EN_ATTENTE,
    DocumentStatus.VALIDE,
    DocumentStatus.REFUSE,
    DocumentStatus.ANNULE
  ];
  
  // Filtres de date
  const dateFilters = [
    { id: 'today', label: "Aujourd'hui" },
    { id: 'week', label: '7 derniers jours' },
    { id: 'month', label: '30 derniers jours' },
    { id: 'year', label: 'Cette année' }
  ];
  
  // Affiche le nom formaté du type de document
  const formatDocumentType = (type: DocumentType) => {
    return type.replace(/_/g, ' ');
  };
  
  // Affiche le nom formaté du statut de document
  const formatDocumentStatus = (status: DocumentStatus) => {
    return status.replace(/_/g, ' ');
  };
  
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
  
  // Rendu d'un élément de la liste
  const renderItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      key={item.id}
      className="bg-white shadow-sm rounded-lg mb-3 flex-row p-3"
      onPress={() => navigateToDocument(item.id)}
    >
      <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
        <MaterialIcons name={getIconForType(item.type)} size={24} color="#1e40af" />
      </View>
      
      <View className="flex-1 justify-center">
        <Text className="text-lg font-semibold text-gray-800">{item.reference}</Text>
        <Text className="text-sm text-gray-500">
          {formatDocumentType(item.type)} • {formatDate(item.issue_date)}
          {item.status && ` • ${formatDocumentStatus(item.status)}`}
        </Text>
        
        {item.amount !== null && (
          <Text className="text-sm text-blue-800 font-medium mt-1">
            {item.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </Text>
        )}
      </View>
      
      <View className="justify-center">
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </View>
    </TouchableOpacity>
  );
  
  // Rendu des sections mensuelles
  const renderMonthSections = () => {
    return Object.entries(documentsByMonth).map(([monthYear, docs]) => (
      <View key={monthYear} className="mb-4">
        <TouchableOpacity 
          className="flex-row items-center bg-white rounded-lg p-3 shadow-sm"
          onPress={() => toggleSection(monthYear)}
        >
          <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
            <Text className="font-bold text-blue-800">{docs.length}</Text>
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
            {docs.map(doc => renderItem({ item: doc }))}
          </View>
        </AccordionItem>
      </View>
    ));
  };
  
  // Titre du filtre actuel
  const getFilterTitle = () => {
    switch (currentFilter) {
      case FilterType.TYPE:
        return 'Filtrer par type';
      case FilterType.STATUS:
        return 'Filtrer par statut';
      case FilterType.DATE:
        return 'Filtrer par date';
    }
  };
  
  // Rendu du contenu du filtre
  const renderFilterContent = () => {
    switch (currentFilter) {
      case FilterType.TYPE:
        return (
          <ScrollView 
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            style={{ maxHeight: 75 }}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center' }}
          >
            <TouchableOpacity 
              className="mx-1 px-3 py-1 rounded-full border"
              style={{ backgroundColor: selectedType === null ? '#3b82f6' : '#f3f4f6', borderColor: selectedType === null ? '#2563eb' : '#e5e7eb' }}
              onPress={() => setSelectedType(null)}
            >
              <Text style={{ color: selectedType === null ? '#ffffff' : '#1f2937' }}>Tous</Text>
            </TouchableOpacity>
            
            {documentTypes.map(type => (
              <TouchableOpacity 
                key={type}
                className="mx-1 px-3 py-1 rounded-full border"
                style={{ backgroundColor: selectedType === type ? '#3b82f6' : '#f3f4f6', borderColor: selectedType === type ? '#2563eb' : '#e5e7eb' }}
                onPress={() => setSelectedType(type)}
              >
                <Text style={{ color: selectedType === type ? '#ffffff' : '#1f2937' }}>
                  {formatDocumentType(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
      
      case FilterType.STATUS:
        return (
          <ScrollView 
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            style={{ maxHeight: 75 }}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center' }}
          >
            <TouchableOpacity 
              className="mx-1 px-3 py-1 rounded-full border"
              style={{ backgroundColor: selectedStatus === null ? '#3b82f6' : '#f3f4f6', borderColor: selectedStatus === null ? '#2563eb' : '#e5e7eb' }}
              onPress={() => setSelectedStatus(null)}
            >
              <Text style={{ color: selectedStatus === null ? '#ffffff' : '#1f2937' }}>Tous</Text>
            </TouchableOpacity>
            
            {documentStatuses.map(status => (
              <TouchableOpacity 
                key={status}
                className="mx-1 px-3 py-1 rounded-full border"
                style={{ backgroundColor: selectedStatus === status ? '#3b82f6' : '#f3f4f6', borderColor: selectedStatus === status ? '#2563eb' : '#e5e7eb' }}
                onPress={() => setSelectedStatus(status)}
              >
                <Text style={{ color: selectedStatus === status ? '#ffffff' : '#1f2937' }}>
                  {formatDocumentStatus(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
      
      case FilterType.DATE:
        return (
          <ScrollView 
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            style={{ maxHeight: 75 }}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center' }}
          >
            <TouchableOpacity 
              className="mx-1 px-3 py-1 rounded-full border"
              style={{ backgroundColor: selectedDateFilter === null ? '#3b82f6' : '#f3f4f6', borderColor: selectedDateFilter === null ? '#2563eb' : '#e5e7eb' }}
              onPress={() => setSelectedDateFilter(null)}
            >
              <Text style={{ color: selectedDateFilter === null ? '#ffffff' : '#1f2937' }}>Tous</Text>
            </TouchableOpacity>
            
            {dateFilters.map(filter => (
              <TouchableOpacity 
                key={filter.id}
                className="mx-1 px-3 py-1 rounded-full border"
                style={{ backgroundColor: selectedDateFilter === filter.id ? '#3b82f6' : '#f3f4f6', borderColor: selectedDateFilter === filter.id ? '#2563eb' : '#e5e7eb' }}
                onPress={() => setSelectedDateFilter(filter.id)}
              >
                <Text style={{ color: selectedDateFilter === filter.id ? '#ffffff' : '#1f2937' }}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
    }
  };
  
  // Gérer l'affichage de la modale de document
  const handleShowDocumentModal = (show: boolean, projectId?: number, clientId?: number) => {
    setShowDocumentModal(show);
    setModalProjectId(projectId || 1);
    setModalClientId(clientId);
  };
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-6">
      <Stack.Screen
        options={{
          title: 'Documents',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      {/* Modale de document */}
      <DocumentsModal 
        visible={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        projectId={modalProjectId}
        clientId={modalClientId}
        onSuccess={() => {
          console.log('Document ajouté avec succès');
          setShowDocumentModal(false);
          // Recharger les documents ici si nécessaire
        }}
      />
      
      {/* Liste des documents */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-600">Chargement des documents...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text className="mt-4 text-gray-800 font-medium">Erreur de chargement</Text>
          <Text className="mt-2 text-gray-600 text-center">{error}</Text>
        </View>
      ) : filteredDocuments && filteredDocuments.length > 0 ? (
        <ScrollView className="flex-1 px-4 pt-4 pb-32">
          {renderMonthSections()}
        </ScrollView>
      ) : (
        <View className="flex-1 justify-center items-center p-4">
          <MaterialIcons name="folder-open" size={64} color="#d1d5db" />
          <Text className="mt-4 text-gray-500 text-lg">
            {(searchQuery.length > 0 || selectedType || selectedStatus || selectedDateFilter)
              ? "Aucun document ne correspond à votre recherche" 
              : "Aucun document disponible"}
          </Text>
        </View>
      )}
      
      {/* Floating Action Button */}
      <DocumentsFAB 
        filtersVisible={filterVisible} 
        projectId={modalProjectId}
        clientId={modalClientId}
        onShowModal={handleShowDocumentModal}
      />
      
      {/* Barre de recherche et filtres en bas de l'écran */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 shadow-lg">
        {/* Barre de recherche */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 flex-row bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 items-center">
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-gray-800"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            className="ml-2 bg-blue-50 p-2 rounded-lg border border-blue-200"
            onPress={() => setFilterVisible(!filterVisible)}
          >
            <MaterialIcons 
              name="filter-list" 
              size={24} 
              color={(selectedType || selectedStatus || selectedDateFilter) ? "#1e40af" : "#6b7280"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Filtres */}
        {filterVisible && (
          <Animated.View 
            className="mb-2 bg-gray-50 p-3 rounded-lg"
            style={{ transform: [{ translateX: filterPosition }] }}
            {...panResponder.panHandlers}
          >
            <View className="flex-row items-center justify-between border-b border-gray-400 pb-4 mb-4">
              <TouchableOpacity onPress={switchToPrevFilter}>
                <Ionicons name="chevron-back" size={20} color="#6b7280" />
              </TouchableOpacity>
              
              <Text className="font-medium text-gray-800">{getFilterTitle()}</Text>
              
              <TouchableOpacity onPress={switchToNextFilter}>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            {renderFilterContent()}
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}