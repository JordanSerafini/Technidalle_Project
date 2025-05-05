import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Address } from '../../../utils/interfaces/address.interface';
import { Client } from '../../../utils/interfaces/client.interface';

// Extension de l'interface Client pour inclure address_id
interface ClientWithAddress extends Client {
  address_id?: number;
}

interface AddresseAddProjectProps {
  selectedClient: ClientWithAddress | null;
  selectedAddress: Address | null;
  setSelectedAddress: React.Dispatch<React.SetStateAction<Address | null>>;
  clientAddresses: Address[];
  addressesLoading: boolean;
  addressesError: any;
}

const AddresseAddProject: React.FC<AddresseAddProjectProps> = ({
  selectedClient,
  selectedAddress,
  setSelectedAddress,
  clientAddresses,
  addressesLoading,
  addressesError
}) => {
  const [showAddressSelection, setShowAddressSelection] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [useClientAddress, setUseClientAddress] = useState(false);

  // Formatter une adresse pour l'affichage
  const formatAddress = (address: Address) => {
    return `${address.street_number || ''} ${address.street_name}, ${address.zip_code} ${address.city}`;
  };

  // Filtrer les adresses selon la recherche
  const filteredAddresses = clientAddresses?.filter(address => {
    const fullAddress = `${address.street_number || ''} ${address.street_name}, ${address.zip_code} ${address.city}`.toLowerCase();
    const query = addressSearchQuery.toLowerCase();
    
    return fullAddress.includes(query);
  }) || [];

  // Charger l'adresse principale du client si disponible
  useEffect(() => {
    if (selectedClient && useClientAddress && clientAddresses && clientAddresses.length > 0) {
      // Prendre la première adresse du client
      setSelectedAddress(clientAddresses[0]);
    }
  }, [useClientAddress, selectedClient, clientAddresses]);

  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
    setShowAddressSelection(false);
  };

  return (
    <>
      {/* Sélection d'adresse */}
      <Text className="text-base font-bold mt-3 mb-2 text-indigo-700">Adresse du chantier</Text>
      
      {selectedClient && clientAddresses && clientAddresses.length > 0 && (
        <TouchableOpacity 
          className="flex-row items-center mb-2"
          onPress={() => {
            setUseClientAddress(!useClientAddress);
            if (!useClientAddress) {
              setSelectedAddress(clientAddresses[0]);
            } else {
              setSelectedAddress(null);
            }
          }}
        >
          <View className={`w-5 h-5 border border-indigo-700 rounded-sm mr-2 justify-center items-center ${useClientAddress ? 'bg-indigo-700' : 'bg-white'}`}>
            {useClientAddress && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
          <Text className="text-sm text-gray-700">Utiliser l'adresse du client</Text>
        </TouchableOpacity>
      )}
      
      {selectedAddress ? (
        <View className="flex-row justify-between items-center p-3 border border-gray-300 rounded-md mb-4 bg-indigo-50">
          <View>
            <Text className="text-base font-bold">{formatAddress(selectedAddress)}</Text>
          </View>
          <TouchableOpacity 
            className="p-1"
            onPress={() => {
              if (selectedClient && clientAddresses && clientAddresses.length > 0) {
                setShowAddressSelection(true);
              } else {
                alert("Veuillez d'abord sélectionner un client avec des adresses");
              }
              setUseClientAddress(false);
            }}
          >
            <Text className="text-indigo-700 underline">Changer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          className="flex-row justify-between items-center p-3 border border-indigo-700 rounded-md mb-4"
          onPress={() => {
            if (selectedClient) {
              setShowAddressSelection(true);
            } else {
              alert("Veuillez d'abord sélectionner un client");
            }
          }}
        >
          <Text className="text-indigo-700">Sélectionner une adresse</Text>
          <Ionicons name="chevron-forward" size={20} color="#3F51B5" />
        </TouchableOpacity>
      )}

      {/* Message informatif si le client n'a pas d'adresse */}
      {selectedClient && clientAddresses && clientAddresses.length === 0 && (
        <Text className="text-sm text-amber-600 mb-2">
          Ce client n'a pas d'adresse enregistrée. Vous devrez en créer une.
        </Text>
      )}

      {/* Modale pour la sélection d'adresse */}
      <Modal
        visible={showAddressSelection}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressSelection(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="w-[90%] h-[80%] bg-white rounded-lg p-4 max-w-[500px]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold">Sélectionner une adresse</Text>
              <TouchableOpacity onPress={() => setShowAddressSelection(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            
            {selectedClient ? (
              <>
                {clientAddresses && clientAddresses.length > 0 ? (
                  <>
                    <View className="flex-row items-center border border-gray-300 rounded-md mb-4 px-3 bg-gray-50">
                      <Ionicons name="search" size={20} color="#888" className="mr-2" />
                      <TextInput
                        className="flex-1 h-10"
                        placeholder="Rechercher une adresse..."
                        value={addressSearchQuery}
                        onChangeText={setAddressSearchQuery}
                      />
                    </View>
                    
                    {addressesLoading ? (
                      <ActivityIndicator size="large" color="#3F51B5" className="my-5" />
                    ) : addressesError ? (
                      <Text className="text-center py-5 text-red-500">Erreur de chargement des adresses</Text>
                    ) : (
                      <>
                        <FlatList
                          data={filteredAddresses}
                          keyExtractor={(item: Address) => item.id?.toString() || Math.random().toString()}
                          renderItem={({ item }: { item: Address }) => (
                            <TouchableOpacity 
                              className="flex-row justify-between items-center p-4 border-b border-gray-200"
                              onPress={() => handleSelectAddress(item)}
                            >
                              <View>
                                <Text className="text-base font-medium">{formatAddress(item)}</Text>
                              </View>
                              <Ionicons name="chevron-forward" size={20} color="#888" />
                            </TouchableOpacity>
                          )}
                          ListEmptyComponent={() => (
                            <Text className="text-center py-5 text-gray-600">Aucune adresse trouvée</Text>
                          )}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <Text className="text-center py-5">
                    Ce client n'a pas encore d'adresse. Vous pouvez en ajouter une.
                  </Text>
                )}
                
                <TouchableOpacity 
                  className="flex-row items-center justify-center p-4 mt-4 border border-indigo-700 rounded-md"
                  onPress={() => {
                    // Pour le moment, nous allons juste fermer cette modale
                    // TODO: Implémenter la création d'adresse
                    setShowAddressSelection(false);
                    alert("Fonctionnalité de création d'adresse à implémenter.");
                  }}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#3F51B5" />
                  <Text className="text-indigo-700 font-medium ml-2">Ajouter une nouvelle adresse</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text className="text-center py-5">Veuillez d'abord sélectionner un client</Text>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

export default AddresseAddProject;
