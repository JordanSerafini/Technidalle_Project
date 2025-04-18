import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Modal, Linking, Alert, TextInput, Animated, PanResponder, SafeAreaView, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import useFetch from '@/app/hooks/useFetch';
import { Client } from '@/app/utils/interfaces/client.interface';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useClientsStore } from '@/app/store/clientsStore';

// Obtenir les dimensions de l'écran
const { width } = Dimensions.get('window');

// Types de filtres disponibles
enum FilterType {
  TYPE = 'type',
  CITY = 'city',
  STATUS = 'status',
  LAST_ORDER = 'lastOrder',
}

// Types pour améliorer les performances
interface FormattedClientData {
  displayName: string;
  secondaryDisplay: string;
  statusColor: string;
  displayStatus: string;
  hasRecentOrders: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  city: string | undefined;
}

// Cache pour les données clients formatées, avec clés de type string ou number
const clientDataCache = new Map<string | number, FormattedClientData>();

// Composant Modal séparé pour les appels téléphoniques
const PhoneModal = React.memo(({ 
  visible, 
  client, 
  onClose, 
  onCall 
}: { 
  visible: boolean, 
  client: Client | null, 
  onClose: () => void, 
  onCall: (phone: string) => void 
}) => {
  if (!client) return null;
  
  const handleCallFixed = useCallback(() => {
    if (client.phone) onCall(client.phone);
  }, [client, onCall]);
  
  const handleCallMobile = useCallback(() => {
    if (client.mobile) onCall(client.mobile);
  }, [client, onCall]);
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-lg p-4 w-80">
          <Text className="text-lg font-bold mb-4 text-center">Choisir un numéro</Text>
          
          {client.phone && (
            <TouchableOpacity 
              className="flex-row items-center p-3 border-b border-gray-200"
              onPress={handleCallFixed}
            >
              <Ionicons name="call-outline" size={24} color="#2563eb" />
              <Text className="ml-3">{client.phone} (Fixe)</Text>
            </TouchableOpacity>
          )}
          
          {client.mobile && (
            <TouchableOpacity 
              className="flex-row items-center p-3"
              onPress={handleCallMobile}
            >
              <Ionicons name="phone-portrait-outline" size={24} color="#2563eb" />
              <Text className="ml-3">{client.mobile} (Mobile)</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            className="mt-4 p-3 bg-gray-200 rounded-lg"
            onPress={onClose}
          >
            <Text className="text-center">Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}, (prevProps, nextProps) => {
  // Ne re-rendre que si la visibilité change ou le client change d'ID
  return prevProps.visible === nextProps.visible && 
         prevProps.client?.id === nextProps.client?.id;
});

// Interface pour les options de fetch étendues
interface ExtendedFetchOptions {
  limit?: number;
  offset?: number;
  searchQuery?: string;
  typeFilter?: string;
  cityFilter?: string;
  statusFilter?: string;
  lastOrderFilter?: string;
}

// Composant FilterOption pour les boutons de filtre
const FilterOption = React.memo(({ 
  label, 
  isSelected, 
  onPress 
}: { 
  label: string, 
  isSelected: boolean, 
  onPress: () => void 
}) => {
  // Styles précalculés pour éviter les calculs à chaque rendu
  const containerStyle = {
    backgroundColor: isSelected ? '#3b82f6' : '#f3f4f6',
    borderColor: isSelected ? '#2563eb' : '#e5e7eb'
  };
  
  const textStyle = {
    color: isSelected ? '#ffffff' : '#1f2937'
  };
  
  return (
    <TouchableOpacity 
      className="mx-1 px-3 py-1 rounded-full border"
      style={containerStyle}
      onPress={onPress}
    >
      <Text style={textStyle}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return prevProps.label === nextProps.label && 
         prevProps.isSelected === nextProps.isSelected;
});

// Composant FilterScrollView optimisé
const FilterScrollView = React.memo(({ 
  options, 
  selectedOption, 
  onSelect, 
  allLabel = "Tous" 
}: { 
  options: string[], 
  selectedOption: string | null, 
  onSelect: (option: string | null) => void,
  allLabel?: string
}) => {
  const handleAllSelect = useCallback(() => {
    onSelect(null);
  }, [onSelect]);
  
  // Générer les gestionnaires d'événements une seule fois
  const optionHandlers = useMemo(() => {
    return options.map(option => () => onSelect(option));
  }, [options, onSelect]);
  
  return (
    <Animated.ScrollView 
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      style={{ maxHeight: 75 }}
      contentContainerStyle={{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', paddingHorizontal: 8 }}
    >
      {/* Option "Tous" */}
      <FilterOption 
        label={allLabel} 
        isSelected={selectedOption === null} 
        onPress={handleAllSelect} 
      />
      
      {/* Options spécifiques */}
      {options.map((option, index) => (
        <FilterOption 
          key={option}
          label={option} 
          isSelected={selectedOption === option} 
          onPress={optionHandlers[index]} 
        />
      ))}
    </Animated.ScrollView>
  );
}, (prevProps, nextProps) => {
  // Seulement re-rendre si les options changent ou la sélection change
  return prevProps.selectedOption === nextProps.selectedOption && 
         prevProps.options.length === nextProps.options.length;
});

// Helper pour formater les données du client (optimisé avec cache)
const formatClientData = (client: Client): FormattedClientData => {
  // Utiliser le cache si disponible
  if (client.id && clientDataCache.has(client.id)) {
    return clientDataCache.get(client.id)!;
  }
  
  // Nettoyer les valeurs de prénom et nom (éliminer les points seuls, etc.)
  const firstname = client.firstname?.trim();
  const lastname = client.lastname?.trim();
  const companyName = client.company_name?.trim();
  
  // Vérifier s'il s'agit d'un prénom seul sans nom
  const isFirstNameOnly = (firstname && firstname.length > 1 && (!lastname || lastname === '.' || lastname === '..'));
  
  // Gérer les différents cas pour l'affichage du nom
  let displayName = '';
  if (isFirstNameOnly) {
    displayName = firstname;
  } else if ((lastname && lastname !== '.' && lastname !== '..') || (firstname && firstname !== '.' && firstname !== '..')) {
    displayName = `${lastname || ''} ${firstname || ''}`.trim();
  } else if (companyName && companyName !== 'Particulier') {
    displayName = companyName;
  } else {
    displayName = 'Client sans nom';
  }
  
  // Déterminer ce qui doit être affiché comme info secondaire
  let secondaryDisplay = '';
  if (companyName && companyName !== 'Particulier' && displayName !== companyName) {
    secondaryDisplay = companyName;
  } else if (companyName === 'Particulier') {
    secondaryDisplay = 'Particulier';
  }
  
  // Déterminer la couleur du statut
  let statusColor = 'bg-gray-200';
  let displayStatus = '';
  
  if (client.status) {
    const status = client.status.toLowerCase();
    if (status.includes('actif') || status === 'active') {
      statusColor = 'bg-green-200 text-green-800';
      displayStatus = 'Actif';
    } else if (status.includes('inactif') || status === 'inactive') {
      statusColor = 'bg-red-200 text-red-800';
      displayStatus = 'Inactif';
    } else if (status.includes('prospect')) {
      statusColor = 'bg-blue-200 text-blue-800';
      displayStatus = 'Prospect';
    } else {
      displayStatus = client.status;
    }
  }
  
  // Vérifier si le client a des commandes récentes
  let hasRecentOrders = false;
  if (client.last_order_date) {
    const orderDate = new Date(client.last_order_date);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    hasRecentOrders = orderDate >= threeMonthsAgo;
  }
  
  const formattedData = {
    displayName,
    secondaryDisplay,
    statusColor,
    displayStatus,
    hasRecentOrders,
    hasPhone: !!(client.phone || client.mobile),
    hasEmail: !!client.email,
    city: client.addresses?.city
  };
  
  // Stocker dans le cache
  if (client.id) {
    clientDataCache.set(client.id, formattedData);
  }
  
  return formattedData;
};

// Optimisation pour éviter les re-rendus inutiles
const ClientItem = React.memo(({ 
  client, 
  onPhonePress, 
  onEmailPress, 
  onItemPress 
}: { 
  client: Client, 
  onPhonePress: (client: Client, event: any) => void, 
  onEmailPress: (email: string | undefined, event: any) => void, 
  onItemPress: (client: Client) => void 
}) => {
  const { 
    displayName, 
    secondaryDisplay, 
    statusColor, 
    displayStatus, 
    hasRecentOrders,
    hasPhone,
    hasEmail,
    city
  } = formatClientData(client);
  
  // Handlers optimisés pour éviter les re-rendus
  const handleCallPress = useCallback((e: any) => {
    onPhonePress(client, e);
  }, [client, onPhonePress]);
  
  const handleMailPress = useCallback((e: any) => {
    onEmailPress(client.email, e);
  }, [client.email, onEmailPress]);
  
  const handleItemPress = useCallback(() => {
    onItemPress(client);
  }, [client, onItemPress]);
  
  return (
    <TouchableOpacity 
      key={client.id} 
      onPress={handleItemPress}
      className="flex flex-row justify-between w-full mb-1 p-2 border-b bg-white"
      style={{ width: width - 32 }}
    >
      {/* Nom, prénom et société */}
      <View className="flex-col gap-y-1 flex-1">
        <Text className="font-bold text-blue-900" numberOfLines={1}>
          {displayName}
        </Text>
        {secondaryDisplay ? (
          <Text className={`font-thin tracking-wide italic ${secondaryDisplay === "Particulier" ? 'text-green-700' : 'text-blue-700'}`} numberOfLines={1}>
            {secondaryDisplay}
          </Text>
        ) : null}
        
        <View className="flex-row items-center">
          {city ? (
            <Text className="text-gray-500 text-xs mr-2" numberOfLines={1}>
              {city}
            </Text>
          ) : null}
          
          {displayStatus && (
            <Text className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
              {displayStatus}
            </Text>
          )}
          
          {hasRecentOrders && (
            <View className="ml-2 w-2 h-2 rounded-full bg-green-500"></View>
          )}
        </View>
      </View>
      
      {/* Boutons pour appeler et envoyer un email */}
      <View className="flex-row gap-x-3 items-center">
        {hasPhone && (
          <TouchableOpacity onPress={handleCallPress}>
            <Ionicons name="call-outline" size={24} color="#2563eb" />
          </TouchableOpacity>
        )}
        {hasEmail && (
          <TouchableOpacity onPress={handleMailPress}>
            <Ionicons name="mail-outline" size={24} color="#2563eb" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Optimisation: ne re-rendre que si le client a changé
  return prevProps.client.id === nextProps.client.id;
});

export default function ClientsScreen() {
  const router = useRouter();
  const { setSelectedClient } = useClientsStore();
  
  // State local pour les clients actuellement visibles
  const [localClients, setLocalClients] = useState<Client[]>([]);
  
  // Remplacer la ref par un state pour résoudre le problème de mise à jour UI
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

  // SearchBar component pour réduire le rendu
  const SearchBar = React.memo(() => {
    // Fonction pour effacer la recherche
    const clearSearch = useCallback(() => {
      setSearchInput('');
      setSearchQuery('');
      setOffset(0);
      setAllLoaded(false);
    }, []);
  
    return (
      <View className="flex-row items-center px-4 py-3 border-t border-gray-200 bg-white">
        <View className="flex-1 flex-row bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 items-center">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-2 text-gray-800"
            placeholder="Rechercher un client..."
            value={searchInput}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
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
            color={(selectedType || selectedCity || selectedStatus || selectedLastOrder) ? "#1e40af" : "#6b7280"} 
          />
        </TouchableOpacity>
      </View>
    );
  });

  // Rendu de l'écran vide
  const renderEmptyView = useCallback(() => (
    <View className="flex-1 justify-center items-center p-4">
      <MaterialIcons name="people" size={64} color="#d1d5db" />
      <Text className="mt-4 text-gray-500 text-lg">
        {(searchQuery.length > 0 || selectedType || selectedCity || selectedStatus || selectedLastOrder)
          ? "Aucun client ne correspond à votre recherche" 
          : "Aucun client disponible"}
      </Text>
    </View>
  ), [searchQuery, selectedType, selectedCity, selectedStatus, selectedLastOrder]);

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
      
      {filterVisible && (
        <Animated.View 
          className="my-2 mx-4 bg-gray-50 p-3 rounded-lg"
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

      {/* SearchBar fixe en bas de l'écran mais en dehors des rendus conditionnels */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
        <SearchBar />
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