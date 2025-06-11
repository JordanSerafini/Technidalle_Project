import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView, TextInput, ViewStyle, Animated, ScrollView, PanResponder, StyleSheet, Dimensions } from "react-native";
import { useRouter, Stack, Link } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFetch } from '@/app/hooks/useFetch';
import { Document, DocumentType, DocumentStatus } from '@/app/utils/interfaces/document';
import { formatDate } from '@/app/utils/dateFormatter';
import DocumentsFAB from '@/app/components/FAB/documents/documents.fab';
import DocumentsModal from '@/app/components/modals/documents/addDocuments.modal';
import AccordionItem from '@/app/components/documents/AccordionItem';
import { FilterType } from '@/app/utils/constants/documentConstants';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';

type SectionItem = { itemType: 'section'; id: string; monthYear: string; count: number };
type DocItem = Document & { itemType: 'doc'; section: string };
type FlatListItem = SectionItem | DocItem;

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
  const [isDefaultFilter, setIsDefaultFilter] = useState(true);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  
  // État de la modale de document
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [modalProjectId, setModalProjectId] = useState<number | undefined>(undefined);
  const [modalClientId, setModalClientId] = useState<number | undefined>(undefined);
  
  // Déclencheur de rafraîchissement simple
  const [refreshKey, setRefreshKey] = useState(0);
  
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
  
  // Filtrage par défaut (mois courant ou 20 derniers)
  const applyDefaultFilter = useCallback((docs: Document[]) => {
    if (!docs || docs.length === 0) return [];
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    // Documents du mois courant
    const currentMonthDocs = docs.filter(doc => {
      if (!doc.issue_date) return false;
      const d = new Date(doc.issue_date);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });
    if (currentMonthDocs.length >= 5) {
      return currentMonthDocs.sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
    }
    // Sinon, 20 derniers
    return [...docs].sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()).slice(0, 50);
  }, []);

  // Fetch documents
  const { data: documents, loading, error, refetch } = useFetch<Document[]>(`documents`, {});

  // Appliquer le filtre par défaut à l'arrivée des données
  useEffect(() => {
    if (documents && isDefaultFilter) {
      const filtered = applyDefaultFilter(documents);
      setFilteredDocuments(filtered);
      // Auto-expand section la plus récente
      if (filtered.length > 0) {
        const d = new Date(filtered[0].issue_date);
        const monthYear = `${d.getMonth() + 1}/${d.getFullYear()}`;
        setExpandedSections({ [monthYear]: true });
      }
    } else if (documents && !isDefaultFilter) {
      setFilteredDocuments(documents);
    }
  }, [documents, isDefaultFilter, applyDefaultFilter]);

  // Recherche en temps réel
  const searchFilteredDocuments = useMemo(() => {
    if (!filteredDocuments) return [];
    if (!searchQuery.trim()) return filteredDocuments;
    const query = searchQuery.toLowerCase();
    return filteredDocuments.filter(doc =>
      doc.reference?.toLowerCase().includes(query) ||
      doc.type?.toLowerCase().includes(query) ||
      doc.status?.toLowerCase().includes(query)
    );
  }, [filteredDocuments, searchQuery]);

  // Regroupement par mois/année
  const sortedDocumentsByMonth = useMemo(() => {
    if (!searchFilteredDocuments.length) return {};
    const grouped = searchFilteredDocuments.reduce((acc, doc) => {
      const date = new Date(doc.issue_date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(doc);
      return acc;
    }, {} as { [key: string]: Document[] });
    // Trier les mois par ordre chronologique inverse
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
  }, [searchFilteredDocuments]);
  
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
  
  // Palette de couleurs pour les badges de section (nombre de docs)
  const getSectionBadgeColor = (count: number): string => {
    if (count >= 15) return '#EF4444'; // Rouge
    if (count >= 10) return '#F97316'; // Orange
    if (count >= 5) return '#3B82F6'; // Bleu
    return '#10B981'; // Vert
  };
  
  // Carte document moderne
  const DocumentCard = React.memo(({ doc, onPress }: { doc: Document, onPress: (id: number) => void }) => {
    const handlePress = useCallback(() => onPress(doc.id), [doc.id, onPress]);
    const statusColors: Record<string, string> = {
      brouillon: '#F3F4F6',
      en_attente: '#FDE68A',
      valide: '#BBF7D0',
      refuse: '#FCA5A5',
      annule: '#E0E7EF',
    };
    const statusColor = statusColors[doc.status ?? 'brouillon'] || '#E5E7EB';
    return (
      <TouchableOpacity onPress={handlePress} style={styles.card}>
        <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.cardGradient}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <MaterialIcons name={getIconForType(doc.type)} size={22} color="#2563eb" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardRef}>{doc.reference}</Text>
              <Text style={styles.cardType}>{formatDocumentType(doc.type)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}> 
              <Text style={styles.statusText}>{doc.status ? formatDocumentStatus(doc.status) : ''}</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardDate}>{formatDate(doc.issue_date)}</Text>
            {doc.amount !== null && (
              <Text style={styles.cardAmount}>{doc.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</Text>
            )}
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" style={{ marginLeft: 8 }} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  });
  
  // Ajout d'une icône calendrier pour la bannière mois
  const SectionBanner = React.memo(({ title, count, isExpanded, onToggle }: { title: string, count: number, isExpanded: boolean, onToggle: () => void }) => {
    const badgeColor = getSectionBadgeColor(count);
    return (
      <TouchableOpacity onPress={onToggle} style={styles.sectionBanner} activeOpacity={0.85}>
                        <LinearGradient colors={['#E2E8F0', '#CBD5E1']} style={styles.sectionBannerGradient}>
          <View style={styles.sectionBannerIcon}>
            <Ionicons name="calendar" size={22} color="#3B82F6" />
          </View>
          <View style={styles.sectionBannerTitleContainer}>
            <Text style={styles.sectionBannerTitle}>{title}</Text>
          </View>
          <View style={[styles.sectionBannerBadge, { backgroundColor: badgeColor }]}> 
            <Text style={styles.sectionBannerBadgeText}>{count}</Text>
          </View>
          <View style={styles.sectionBannerChevron}>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#64748B" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  });
  
  // Structure pour FlashList : sections et items
  const buildFlatListData = (
    docsByMonth: Record<string, Document[]>,
    expandedSections: Record<string, boolean>
  ): FlatListItem[] => {
    const data: FlatListItem[] = [];
    Object.entries(docsByMonth).forEach(([monthYear, docs]) => {
      const sectionItem: SectionItem = { 
        itemType: 'section', 
        id: `section-${monthYear}`, 
        monthYear, 
        count: docs.length 
      };
      data.push(sectionItem);
      if (expandedSections[monthYear]) {
        docs.forEach((doc: Document) => {
          const docItem: DocItem = { 
            ...doc, 
            itemType: 'doc', 
            section: monthYear 
          };
          data.push(docItem);
        });
      }
    });
    return data;
  };

  const flatListData = useMemo(() => buildFlatListData(documentsByMonth, expandedSections), [documentsByMonth, expandedSections]);
  
  // Fonctions de navigation entre filtres
  const switchToPrevFilter = useCallback(() => {
    const filters = [FilterType.TYPE, FilterType.STATUS, FilterType.DATE];
    const currentIndex = filters.indexOf(currentFilter);
    const prevIndex = currentIndex === 0 ? filters.length - 1 : currentIndex - 1;
    setCurrentFilter(filters[prevIndex]);
  }, [currentFilter]);

  const switchToNextFilter = useCallback(() => {
    const filters = [FilterType.TYPE, FilterType.STATUS, FilterType.DATE];
    const currentIndex = filters.indexOf(currentFilter);
    const nextIndex = currentIndex === filters.length - 1 ? 0 : currentIndex + 1;
    setCurrentFilter(filters[nextIndex]);
  }, [currentFilter]);

  // Fonction de chargement infini
  const loadMoreDocuments = useCallback(() => {
    if (!isLoadingMore && documents && documents.length >= page * 20) {
      setIsLoadingMore(true);
      setPage(prevPage => prevPage + 1);
      setTimeout(() => setIsLoadingMore(false), 1000); // Simulation
    }
  }, [isLoadingMore, documents, page]);

  // Fonction pour rafraîchir les documents
  const refreshDocuments = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    refetch();
  }, [refetch]);

  // Fonction pour gérer l'ouverture de la modale
  const handleShowDocumentModal = useCallback(() => {
    setShowDocumentModal(true);
  }, []);

  // Rendu du contenu des filtres
  const renderFilterContent = useCallback(() => {
    switch (currentFilter) {
      case FilterType.TYPE:
        return (
          <View className="flex-row flex-wrap gap-2">
            {documentTypes.map((type) => (
              <TouchableOpacity
                key={type}
                className={`px-3 py-2 rounded-lg border ${
                  selectedType === type 
                    ? 'bg-blue-100 border-blue-300' 
                    : 'bg-gray-100 border-gray-300'
                }`}
                onPress={() => setSelectedType(selectedType === type ? null : type)}
              >
                <Text className={selectedType === type ? 'text-blue-800' : 'text-gray-700'}>
                  {formatDocumentType(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case FilterType.STATUS:
        return (
          <View className="flex-row flex-wrap gap-2">
            {documentStatuses.map((status) => (
              <TouchableOpacity
                key={status}
                className={`px-3 py-2 rounded-lg border ${
                  selectedStatus === status 
                    ? 'bg-blue-100 border-blue-300' 
                    : 'bg-gray-100 border-gray-300'
                }`}
                onPress={() => setSelectedStatus(selectedStatus === status ? null : status)}
              >
                <Text className={selectedStatus === status ? 'text-blue-800' : 'text-gray-700'}>
                  {formatDocumentStatus(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case FilterType.DATE:
        return (
          <View className="flex-row flex-wrap gap-2">
            {dateFilters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                className={`px-3 py-2 rounded-lg border ${
                  selectedDateFilter === filter.id 
                    ? 'bg-blue-100 border-blue-300' 
                    : 'bg-gray-100 border-gray-300'
                }`}
                onPress={() => setSelectedDateFilter(selectedDateFilter === filter.id ? null : filter.id)}
              >
                <Text className={selectedDateFilter === filter.id ? 'text-blue-800' : 'text-gray-700'}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      default:
        return null;
    }
  }, [currentFilter, selectedType, selectedStatus, selectedDateFilter, documentTypes, documentStatuses, dateFilters]);
  
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
  
  // Rendu FlashList
  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-6">
      <Stack.Screen
        options={{
          title: `Documents${flatListData ? ` (${flatListData.filter(i=>i.itemType==='doc').length})` : ''}`,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
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
      ) : flatListData && flatListData.length > 0 ? (
        <FlashList
          data={flatListData}
          renderItem={({ item }) => {
            if ('itemType' in item && item.itemType === 'section') {
              const section = item as SectionItem;
              return (
                <SectionBanner
                  title={formatMonthYear(section.monthYear)}
                  count={section.count}
                  isExpanded={!!expandedSections[section.monthYear]}
                  onToggle={() => toggleSection(section.monthYear)}
                />
              );
            }
            if ('itemType' in item && item.itemType === 'doc') {
              const doc = item as DocItem;
              return (
                <View style={styles.docsListUnderBanner}>
                  <DocumentCard doc={doc} onPress={navigateToDocument} />
                </View>
              );
            }
            return null;
          }}
          estimatedItemSize={120}
          keyExtractor={(item, idx) => {
            if ('itemType' in item && item.itemType === 'section' && 'id' in item) return (item as SectionItem).id;
            if ('itemType' in item && item.itemType === 'doc' && 'id' in item) return `doc-${(item as DocItem).id}`;
            return `item-${idx}`;
          }}
          onEndReached={loadMoreDocuments}
          onEndReachedThreshold={0.2}
          ListFooterComponent={isLoadingMore ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : null}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
        />
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
      
      {!showDocumentModal && (
        <DocumentsFAB 
          filtersVisible={filterVisible} 
          projectId={modalProjectId}
          clientId={modalClientId}
          onShowModal={handleShowDocumentModal}
        />
      )}
      
      {/* Barre de recherche et filtres en bas de l'écran */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 shadow-lg">
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
        
        
      </View>

      {/* MODALE SIMULÉE : Rendue ici conditionnellement par-dessus tout */}
      {showDocumentModal && (
        <DocumentsModal 
          visible={showDocumentModal}
          onClose={() => setShowDocumentModal(false)}
          projectId={modalProjectId}
          clientId={modalClientId}
          onSuccess={() => {
            console.log('Document ajouté avec succès');
            setShowDocumentModal(false);
          }}
          onDocumentAdded={() => {
            // Rafraîchir la liste lorsqu'un document est ajouté
            refreshDocuments();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Carte document
  card: {
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
  cardGradient: {
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardRef: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardType: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  cardDate: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginRight: 12,
  },
  cardAmount: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '700',
    marginLeft: 8,
  },
  // Section
  sectionBanner: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 0,
    width: '100%',
  },
  sectionBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  sectionBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sectionBannerTitleContainer: {
    flex: 1,
  },
  sectionBannerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  sectionBannerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionBannerChevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  docsListUnderBanner: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
});