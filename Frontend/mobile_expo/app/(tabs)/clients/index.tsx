import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Animated, PanResponder, SafeAreaView, Dimensions, Alert, Linking } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import useFetch from '@/app/hooks/useFetch';
import { Client } from '@/app/utils/interfaces/client.interface';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useClientsStore } from '@/app/store/clientsStore';

// Imports des composants séparés
import ClientItem from '@/app/components/clients/clientsList/ClientItem';
import PhoneModal from '@/app/components/clients/clientsList/PhoneModal';
import FilterScrollView from '@/app/components/clients/clientsList/FilterScrollView';
import SearchBar from '@/app/components/clients/clientsList/SearchBar';

// Imports des types et utilitaires
import { FilterType, ExtendedFetchOptions } from '@/app/utils/types/clientFilters';

// Obtenir les dimensions de l'écran
const { width } = Dimensions.get('window');

export default function ClientsScreen() {
  const router = useRouter();
  const { setSelectedClient } = useClientsStore();
  
  // State local pour les clients actuellement visibles
  const [localClients, setLocalClients] = useState<Client[]>([]);
  
  // States pour la recherche et le filtrage
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedLastOrder, setSelectedLastOrder] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterType>(FilterType.TYPE);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterPosition] = useState(new Animated.Value(0));
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedClientForModal, setSelectedClientForModal] = useState<Client | null>(null);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const PAGE_SIZE = 25;

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

  // Timer pour le debounce de la recherche
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Hook de debounce pour gérer plus efficacement les recherches
  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function(...args: any[]) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
  
  // Récupération des clients avec searchQuery, limit et offset
  const { data, loading, error } = useFetch<Client[]>(`clients?refresh=${refreshKey}`, {
    limit: PAGE_SIZE,
    offset: offset,
    searchQuery: searchQuery.length > 0 ? searchQuery : undefined,
    typeFilter: selectedType || undefined,
    cityFilter: selectedCity || undefined,
    statusFilter: selectedStatus || undefined,
    lastOrderFilter: selectedLastOrder || undefined
  } as ExtendedFetchOptions);

  // Stocker les données dans le state local une fois chargées
  useEffect(() => {
    if (data) {
      if (offset === 0) {
        // Si c'est la première page, remplacer les clients
        setLocalClients(data);
      } else if (data.length > 0) {
        // Sinon, ajouter les nouveaux clients à la liste existante
        setLocalClients(prevClients => [...prevClients, ...data]);
      }
      
      // Si on reçoit moins de clients que la taille de page, on a tout chargé
      if (data.length < PAGE_SIZE) {
        setAllLoaded(true);
      }
      
      setLoadingMore(false);
    }
  }, [data, offset]);

  // Hook de debounce pour gérer plus efficacement les recherches
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      if (text === searchQuery) return; // Éviter les recherches inutiles si le texte n'a pas changé
      setSearchQuery(text);
      setOffset(0);
      setAllLoaded(false);
    }, 800), // Augmenter le délai pour donner plus de temps pour taper
    []
  );

  // Optimiser handleSearchChange avec le nouveau state
  const handleSearchChange = useCallback((text: string) => {
    setSearchInput(text);
    debouncedSearch(text);
  }, [debouncedSearch]);
  
  // Nettoyer le timeout lors du démontage du composant
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Fonction pour charger plus de clients
  const loadMoreClients = useCallback(() => {
    if (!loading && !loadingMore && !allLoaded) {
      setLoadingMore(true);
      setOffset(prevOffset => prevOffset + PAGE_SIZE);
    }
  }, [loading, loadingMore, allLoaded]);

  // Fonction pour passer au filtre suivant
  const switchToNextFilter = () => {
    switch (currentFilter) {
      case FilterType.TYPE:
        setCurrentFilter(FilterType.CITY);
        break;
      case FilterType.CITY:
        setCurrentFilter(FilterType.STATUS);
        break;
      case FilterType.STATUS:
        setCurrentFilter(FilterType.LAST_ORDER);
        break;
      case FilterType.LAST_ORDER:
        setCurrentFilter(FilterType.TYPE);
        break;
    }
  };
  
  // Fonction pour passer au filtre précédent
  const switchToPrevFilter = () => {
    switch (currentFilter) {
      case FilterType.TYPE:
        setCurrentFilter(FilterType.LAST_ORDER);
        break;
      case FilterType.CITY:
        setCurrentFilter(FilterType.TYPE);
        break;
      case FilterType.STATUS:
        setCurrentFilter(FilterType.CITY);
        break;
      case FilterType.LAST_ORDER:
        setCurrentFilter(FilterType.STATUS);
        break;
    }
  };

  // Extraction des types de client (particulier/entreprise)
  const clientTypes = useMemo(() => {
    const types = new Set<string>();
    types.add("Particulier");
    types.add("Entreprise");
    return Array.from(types);
  }, []);

  // Extraction des villes uniques optimisée avec Set et map
  const clientCities = useMemo(() => {
    // Utilise filter(Boolean) pour éliminer les undefined et ajout du cast explicite
    return [...new Set(localClients.map(c => c.addresses?.city).filter(Boolean) as string[])].sort();
  }, [localClients]);

  // Extraction des statuts clients
  const clientStatuses = useMemo(() => {
    return ["Actif", "Inactif", "Prospect"];
  }, []);

  // Options pour le filtre de dernière commande
  const lastOrderOptions = useMemo(() => {
    return ["Avec commandes", "Sans commande", "Récentes"];
  }, []);

  const handlePhonePress = (client: Client, event: any) => {
    // Empêcher la propagation pour éviter de naviguer vers le détail
    event.stopPropagation();
    
    setSelectedClientForModal(client);
    
    if (client.phone && client.mobile) {
      setShowPhoneModal(true);
    } else if (client.phone) {
      handleCall(client.phone);
    } else if (client.mobile) {
      handleCall(client.mobile);
    } else {
      Alert.alert("Information", "Aucun numéro de téléphone disponible pour ce client.");
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
    setShowPhoneModal(false);
  };

  // Fonction optimisée pour manipuler l'email
  const handleEmailPress = (email: string | undefined, event: any) => {
    // Empêcher la propagation pour éviter de naviguer vers le détail
    event.stopPropagation();
    
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const navigateToClientDetail = (client: Client) => {
    // Stockage du client dans le store global
    setSelectedClient(client);
    
    // S'assurer que client.id existe avant de naviguer
    if (client.id) {
      router.navigate({
        pathname: "/clients/[id]",
        params: { id: client.id }
      });
    }
  };
  
  // Titre du filtre actuel
  const getFilterTitle = () => {
    switch (currentFilter) {
      case FilterType.TYPE:
        return 'Filtrer par type';
      case FilterType.CITY:
        return 'Filtrer par ville';
      case FilterType.STATUS:
        return 'Filtrer par statut';
      case FilterType.LAST_ORDER:
        return 'Filtrer par commandes';
    }
  };
  
  // Rendu du contenu du filtre
  const renderFilterContent = () => {
    switch (currentFilter) {
      case FilterType.TYPE:
        return (
          <FilterScrollView 
            options={clientTypes} 
            selectedOption={selectedType} 
            onSelect={setSelectedType} 
          />
        );
      
      case FilterType.CITY:
        return (
          <FilterScrollView 
            options={clientCities} 
            selectedOption={selectedCity} 
            onSelect={setSelectedCity}
            allLabel="Toutes" 
          />
        );
        
      case FilterType.STATUS:
        return (
          <FilterScrollView 
            options={clientStatuses} 
            selectedOption={selectedStatus} 
            onSelect={setSelectedStatus} 
          />
        );
        
      case FilterType.LAST_ORDER:
        return (
          <FilterScrollView 
            options={lastOrderOptions} 
            selectedOption={selectedLastOrder} 
            onSelect={setSelectedLastOrder} 
          />
        );
    }
  };
  
  // Rendu d'un item client pour FlashList
  const renderItem = useCallback(({ item }: { item: Client }) => (
    <ClientItem
      client={item}
      onPhonePress={handlePhonePress}
      onEmailPress={handleEmailPress}
      onItemPress={navigateToClientDetail}
    />
  ), [handlePhonePress, handleEmailPress, navigateToClientDetail]);

  // Key extractor pour optimiser les renders
  const keyExtractor = useCallback((item: Client) => 
    item.id?.toString() ?? Math.random().toString()
  , []);

  // Rendu du footer de la liste (indicateur de chargement)
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    
    return (
      <View className="py-4 flex items-center justify-center">
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text className="text-gray-500 mt-2">Chargement...</Text>
      </View>
    );
  }, [loadingMore]);

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters = selectedType !== null || selectedCity !== null || 
                           selectedStatus !== null || selectedLastOrder !== null;

  // Rendu de l'écran vide
  const renderEmptyView = useCallback(() => (
    <View className="flex-1 justify-center items-center p-4">
      <MaterialIcons name="people" size={64} color="#d1d5db" />
      <Text className="mt-4 text-gray-500 text-lg">
        {(searchQuery.length > 0 || hasActiveFilters)
          ? "Aucun client ne correspond à votre recherche" 
          : "Aucun client disponible"}
      </Text>
    </View>
  ), [searchQuery, hasActiveFilters]);

  // Fonction pour rafraîchir la liste des clients
  const refreshClients = useCallback(() => {
    // Incrémenter la clé pour forcer un nouveau fetch
    setRefreshKey(prev => prev + 1);
    setOffset(0);
    setAllLoaded(false);
    // Réinitialiser les filtres
    setSelectedType(null);
    setSelectedCity(null);
    setSelectedStatus(null);
    setSelectedLastOrder(null);
    setSearchInput('');
    setSearchQuery('');
    setLocalClients([]);
  }, []);

  if (loading && offset === 0) {
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Clients',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      <View style={{ flex: 1 }}>
        {localClients.length > 0 ? (
          <FlashList
            data={localClients}
            renderItem={renderItem}
            estimatedItemSize={50}
            keyExtractor={keyExtractor}
            onEndReached={loadMoreClients}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
            refreshing={loading && offset === 0}
            onRefresh={refreshClients}
          />
        ) : renderEmptyView()}
      </View>

      {/* Vue pour le filtre et la barre de recherche en bas de l'écran */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
        {filterVisible && (
          <Animated.View 
          className="mx-4 bg-gray-50 p-3 rounded-lg"
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
        
        <SearchBar 
          searchInput={searchInput}
          onSearchChange={handleSearchChange}
          onFilterToggle={() => setFilterVisible(!filterVisible)}
          hasFilters={hasActiveFilters}
        />
      </View>

      {/* Modal pour choisir entre téléphone fixe et mobile */}
      <PhoneModal
        visible={showPhoneModal}
        client={selectedClientForModal}
        onClose={() => setShowPhoneModal(false)}
        onCall={handleCall}
      />
    </SafeAreaView>
  );
}