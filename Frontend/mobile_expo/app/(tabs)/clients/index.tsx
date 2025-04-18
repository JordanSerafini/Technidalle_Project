import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, Linking, Alert, TextInput, Animated, PanResponder, SafeAreaView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import useFetch from '@/app/hooks/useFetch';
import { Client } from '@/app/utils/interfaces/client.interface';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useClientsStore } from '@/app/store/clientsStore';

// Types de filtres disponibles
enum FilterType {
  TYPE = 'type',
  CITY = 'city',
}

export default function ClientsScreen() {
  const router = useRouter();
  const { setSelectedClient } = useClientsStore();
  
  // State local pour les clients actuellement visibles
  const [localClients, setLocalClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
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
  
  // Appliquer le debounce à la recherche
  const handleSearchChange = (text: string) => {
    setSearchInputValue(text);
    
    // Annuler le timeout précédent s'il existe
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Définir un nouveau timeout
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(text);
      applyFilters(localClients, text, selectedType, selectedCity);
      
      setOffset(0); // Réinitialiser l'offset lors d'une nouvelle recherche
      if (text.length > 0) {
        setAllLoaded(false); // Réinitialiser le flag
      }
    }, 500); // Délai de 500ms avant d'appliquer la recherche
  };
  
  // Nettoyer le timeout lors du démontage du composant
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Récupération des clients avec searchQuery, limit et offset
  const { data, loading, error } = useFetch<Client[]>(`clients?refresh=${refreshKey}`, {
    limit: PAGE_SIZE,
    offset: offset,
    searchQuery: searchQuery.length > 0 ? searchQuery : undefined
  });

  // Fonction pour appliquer les filtres localement
  const applyFilters = useCallback((clients: Client[], query?: string, type?: string | null, city?: string | null) => {
    if (!clients) {
      setFilteredClients([]);
      return;
    }
    
    if (!query && !type && !city) {
      setFilteredClients(clients);
      return;
    }
    
    const filtered = clients.filter(client => {
      // Filtre par type (particulier/entreprise)
      let typeMatch = true;
      if (type) {
        if (type === "Particulier") {
          typeMatch = client.company_name === "Particulier";
        } else if (type === "Entreprise") {
          typeMatch = client.company_name !== "Particulier" && !!client.company_name;
        }
      }
      
      // Filtre par ville
      const cityMatch = city ? 
        client.addresses?.city === city : true;
      
      // Filtre par recherche textuelle
      let searchMatch = true;
      if (query && query.length > 0) {
        const q = query.toLowerCase();
        searchMatch = !!(
          (client.firstname && client.firstname.toLowerCase().includes(q)) ||
          (client.lastname && client.lastname.toLowerCase().includes(q)) ||
          (client.company_name && client.company_name.toLowerCase().includes(q)) ||
          (client.email && client.email.toLowerCase().includes(q)) ||
          (client.phone && client.phone.toLowerCase().includes(q)) ||
          (client.mobile && client.mobile.toLowerCase().includes(q)) ||
          (client.addresses?.city && client.addresses.city.toLowerCase().includes(q))
        );
      }
      
      return typeMatch && cityMatch && searchMatch;
    });
    
    setFilteredClients(filtered);
  }, []);

  // Stocker les données dans le state local une fois chargées
  useEffect(() => {
    if (data) {
      if (offset === 0) {
        // Si c'est la première page, remplacer les clients
        setLocalClients(data);
        applyFilters(data, searchQuery, selectedType, selectedCity);
      } else if (data.length > 0) {
        // Sinon, ajouter les nouveaux clients à la liste existante
        const newClients = [...localClients, ...data];
        setLocalClients(newClients);
        applyFilters(newClients, searchQuery, selectedType, selectedCity);
      }
      
      // Si on reçoit moins de clients que la taille de page, on a tout chargé
      if (data.length < PAGE_SIZE) {
        setAllLoaded(true);
      }
      
      setLoadingMore(false);
    }
  }, [data, offset, applyFilters, searchQuery, selectedType, selectedCity]);

  // Appliquer les filtres quand selectedType ou selectedCity changent
  useEffect(() => {
    applyFilters(localClients, searchQuery, selectedType, selectedCity);
  }, [selectedType, selectedCity, localClients, applyFilters, searchQuery]);

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
        setCurrentFilter(FilterType.TYPE);
        break;
    }
  };
  
  // Fonction pour passer au filtre précédent
  const switchToPrevFilter = () => {
    switch (currentFilter) {
      case FilterType.TYPE:
        setCurrentFilter(FilterType.CITY);
        break;
      case FilterType.CITY:
        setCurrentFilter(FilterType.TYPE);
        break;
    }
  };

  // Extraction des types de client (particulier/entreprise)
  const clientTypes = useMemo(() => {
    if (!localClients) return [];
    
    const types = new Set<string>();
    localClients.forEach(client => {
      if (client.company_name) {
        types.add(client.company_name === "Particulier" ? "Particulier" : "Entreprise");
      }
    });
    
    return Array.from(types);
  }, [localClients]);

  // Extraction des villes uniques
  const clientCities = useMemo(() => {
    if (!localClients) return [];
    
    const cities = new Set<string>();
    localClients.forEach(client => {
      if (client.addresses?.city) {
        cities.add(client.addresses.city);
      }
    });
    
    return Array.from(cities).sort();
  }, [localClients]);

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

  const handleEmailPress = (email: string, event: any) => {
    // Empêcher la propagation pour éviter de naviguer vers le détail
    event.stopPropagation();
    
    Linking.openURL(`mailto:${email}`);
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
    }
  };
  
  // Rendu du contenu du filtre
  const renderFilterContent = () => {
    switch (currentFilter) {
      case FilterType.TYPE:
        return (
          <Animated.ScrollView 
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
            
            {clientTypes.map(type => (
              <TouchableOpacity 
                key={type}
                className="mx-1 px-3 py-1 rounded-full border"
                style={{ backgroundColor: selectedType === type ? '#3b82f6' : '#f3f4f6', borderColor: selectedType === type ? '#2563eb' : '#e5e7eb' }}
                onPress={() => setSelectedType(type)}
              >
                <Text style={{ color: selectedType === type ? '#ffffff' : '#1f2937' }}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
        );
      
      case FilterType.CITY:
        return (
          <Animated.ScrollView 
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            style={{ maxHeight: 75 }}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center' }}
          >
            <TouchableOpacity 
              className="mx-1 px-3 py-1 rounded-full border"
              style={{ backgroundColor: selectedCity === null ? '#3b82f6' : '#f3f4f6', borderColor: selectedCity === null ? '#2563eb' : '#e5e7eb' }}
              onPress={() => setSelectedCity(null)}
            >
              <Text style={{ color: selectedCity === null ? '#ffffff' : '#1f2937' }}>Toutes</Text>
            </TouchableOpacity>
            
            {clientCities.map(city => (
              <TouchableOpacity 
                key={city}
                className="mx-1 px-3 py-1 rounded-full border"
                style={{ backgroundColor: selectedCity === city ? '#3b82f6' : '#f3f4f6', borderColor: selectedCity === city ? '#2563eb' : '#e5e7eb' }}
                onPress={() => setSelectedCity(city)}
              >
                <Text style={{ color: selectedCity === city ? '#ffffff' : '#1f2937' }}>
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
        );
    }
  };
  
  // Rendu d'un élément de la liste
  const renderClientItem = ({ item: client }: { item: Client }) => {
    // Déterminer ce qui doit être affiché comme nom principal
    let displayName = '';
    
    // Nettoyer les valeurs de prénom et nom (éliminer les points seuls, etc.)
    const firstname = client.firstname?.trim();
    const lastname = client.lastname?.trim();
    const companyName = client.company_name?.trim();
    
    // Vérifier s'il s'agit d'un prénom seul sans nom (comme "Amélie", "Caroline")
    const isFirstNameOnly = (firstname && firstname.length > 1 && (!lastname || lastname === '.' || lastname === '..'));
    
    // Gérer les différents cas pour l'affichage du nom
    if (isFirstNameOnly) {
      // Si c'est un prénom sans nom de famille valide
      displayName = firstname;
    } else if ((lastname && lastname !== '.' && lastname !== '..') || (firstname && firstname !== '.' && firstname !== '..')) {
      // Si on a un nom ou un prénom valide (pas juste un point)
      displayName = `${lastname || ''} ${firstname || ''}`.trim();
    } else if (companyName && companyName !== 'Particulier') {
      // Si on a un nom d'entreprise et pas de nom/prénom valides
      displayName = companyName;
    } else {
      // Cas par défaut si rien d'autre n'est disponible
      displayName = 'Client sans nom';
    }
    
    // Déterminer ce qui doit être affiché comme info secondaire
    let secondaryDisplay = '';
    
    // Afficher le nom de l'entreprise comme info secondaire uniquement si ce n'est pas déjà le nom principal
    if (companyName && companyName !== 'Particulier' && displayName !== companyName) {
      secondaryDisplay = companyName;
    } else if (companyName === 'Particulier') {
      secondaryDisplay = 'Particulier';
    }
    
    return (
      <TouchableOpacity 
        key={client.id} 
        onPress={() => navigateToClientDetail(client)}
        className="flex flex-row justify-between w-full mb-2 p-3 border-b bg-white"
      >
        {/* Nom, prénom et société */}
        <View className="flex-col gap-y-1 flex-1">
          <Text className="font-bold text-blue-900">
            {displayName}
          </Text>
          {secondaryDisplay ? (
            <Text className={`font-thin tracking-wide italic ${secondaryDisplay === "Particulier" ? 'text-green-700' : 'text-blue-700'}`}>
              {secondaryDisplay}
            </Text>
          ) : null}
          {client.addresses?.city ? (
            <Text className="text-gray-500 text-xs">
              {client.addresses.city}
            </Text>
          ) : null}
        </View>
        {/* Boutons pour appeler et envoyer un email */}
        <View className="flex-row gap-x-3 items-center">
          {(client.phone || client.mobile) && (
            <TouchableOpacity onPress={(e) => handlePhonePress(client, e)}>
              <Ionicons name="call-outline" size={24} color="#2563eb" />
            </TouchableOpacity>
          )}
          {client.email && (
            <TouchableOpacity onPress={(e) => handleEmailPress(client.email, e)}>
              <Ionicons name="mail-outline" size={24} color="#2563eb" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Rendu du footer de la liste (indicateur de chargement)
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View className="py-4 flex items-center justify-center">
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text className="text-gray-500 mt-2">Chargement...</Text>
      </View>
    );
  };

  const refreshClients = () => {
    // Incrémenter la clé pour forcer un nouveau fetch
    setRefreshKey(prev => prev + 1);
    setOffset(0);
    setAllLoaded(false);
    // Réinitialiser les filtres
    setSelectedType(null);
    setSelectedCity(null);
    setSearchInputValue('');
    setSearchQuery('');
    setLocalClients([]);
    setFilteredClients([]);
  };

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
    <SafeAreaView className="flex-1 bg-gray-50 pt-6">
      <Stack.Screen
        options={{
          title: 'Clients',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
     
      {/* Liste des clients */}
      {filteredClients && filteredClients.length > 0 ? (
        <FlatList
          data={filteredClients}
          renderItem={renderClientItem}
          keyExtractor={(item: Client) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 80 }}
          onEndReached={loadMoreClients}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          refreshing={loading && offset === 0}
          onRefresh={refreshClients}
        />
      ) : (
        <View className="flex-1 justify-center items-center p-4">
          <MaterialIcons name="people" size={64} color="#d1d5db" />
          <Text className="mt-4 text-gray-500 text-lg">
            {(searchQuery.length > 0 || selectedType || selectedCity)
              ? "Aucun client ne correspond à votre recherche" 
              : "Aucun client disponible"}
          </Text>
        </View>
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
              placeholder="Rechercher un client..."
              value={searchInputValue}
              onChangeText={handleSearchChange}
            />
            {searchInputValue.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchInputValue('');
                setSearchQuery('');
                applyFilters(localClients, '', selectedType, selectedCity);
                setOffset(0);
                setAllLoaded(false);
              }}>
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
              color={(selectedType || selectedCity) ? "#1e40af" : "#6b7280"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal pour choisir entre téléphone fixe et mobile */}
      <Modal
        visible={showPhoneModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhoneModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-lg p-4 w-80">
            <Text className="text-lg font-bold mb-4 text-center">Choisir un numéro</Text>
            
            {selectedClientForModal?.phone && (
              <TouchableOpacity 
                className="flex-row items-center p-3 border-b border-gray-200"
                onPress={() => handleCall(selectedClientForModal.phone || '')}
              >
                <Ionicons name="call-outline" size={24} color="#2563eb" />
                <Text className="ml-3">{selectedClientForModal.phone} (Fixe)</Text>
              </TouchableOpacity>
            )}
            
            {selectedClientForModal?.mobile && (
              <TouchableOpacity 
                className="flex-row items-center p-3"
                onPress={() => handleCall(selectedClientForModal.mobile || '')}
              >
                <Ionicons name="phone-portrait-outline" size={24} color="#2563eb" />
                <Text className="ml-3">{selectedClientForModal.mobile} (Mobile)</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              className="mt-4 p-3 bg-gray-200 rounded-lg"
              onPress={() => setShowPhoneModal(false)}
            >
              <Text className="text-center">Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 