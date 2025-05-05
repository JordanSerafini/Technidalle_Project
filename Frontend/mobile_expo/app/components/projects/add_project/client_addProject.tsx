import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Client } from '../../../utils/interfaces/client.interface';
import { useFetch } from '../../../hooks/useFetch';

// Extension de l'interface Client pour inclure address_id
interface ClientWithAddress extends Client {
  address_id?: number;
}

// Interface pour la création d'un client
interface NewClientForm {
  firstname: string;
  lastname: string;
  email: string;
  company_name: string;
  phone: string;
  mobile: string;
  siret: string;
  notes: string;
}

// Interface pour la création d'une adresse
interface NewAddressForm {
  street_number: string;
  street_name: string;
  additional_address: string;
  zip_code: string;
  city: string;
  country: string;
}

interface ClientAddProjectProps {
  selectedClient: ClientWithAddress | null;
  setSelectedClient: React.Dispatch<React.SetStateAction<ClientWithAddress | null>>;
  clients: ClientWithAddress[];
  clientsLoading: boolean;
  clientsError: any;
}

const ClientAddProject: React.FC<ClientAddProjectProps> = ({
  selectedClient,
  setSelectedClient,
  clients,
  clientsLoading,
  clientsError
}) => {
  const [showClientSelection, setShowClientSelection] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showCreateClientForm, setShowCreateClientForm] = useState(false);
  const [createWithAddress, setCreateWithAddress] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);

  // État pour le formulaire de création de client
  const [newClient, setNewClient] = useState<NewClientForm>({
    firstname: '',
    lastname: '',
    email: '',
    company_name: '',
    phone: '',
    mobile: '',
    siret: '',
    notes: ''
  });

  // État pour le formulaire de création d'adresse
  const [newAddress, setNewAddress] = useState<NewAddressForm>({
    street_number: '',
    street_name: '',
    additional_address: '',
    zip_code: '',
    city: '',
    country: 'France'
  });
  
  // État pour déclencher les appels API
  const [clientToCreate, setClientToCreate] = useState<any>(null);
  const [clientWithAddressToCreate, setClientWithAddressToCreate] = useState<any>(null);

  // Hooks pour les appels API
  const { data: createdClient, loading: creatingClientData, error: createClientError } = 
    useFetch<ClientWithAddress>(
      clientToCreate ? 'clients' : null, 
      { 
        method: 'POST', 
        body: clientToCreate,
        refresh: clientToCreate ? JSON.stringify(clientToCreate) : undefined 
      }
    );

  const { data: createdClientWithAddress, loading: creatingClientWithAddressData, error: createClientWithAddressError } = 
    useFetch<ClientWithAddress>(
      clientWithAddressToCreate ? 'clients/with-address' : null, 
      { 
        method: 'POST', 
        body: clientWithAddressToCreate,
        refresh: clientWithAddressToCreate ? JSON.stringify(clientWithAddressToCreate) : undefined 
      }
    );

  // Filtrer les clients selon la recherche
  const filteredClients = clients?.filter(client => {
    const fullName = `${client.firstname} ${client.lastname}`.toLowerCase();
    const company = client.company_name?.toLowerCase() || '';
    const query = clientSearchQuery.toLowerCase();
    
    return fullName.includes(query) || company.includes(query);
  }) || [];

  const handleSelectClient = (client: ClientWithAddress) => {
    setSelectedClient(client);
    setShowClientSelection(false);
  };

  // Fonction pour réinitialiser les formulaires
  const resetForms = () => {
    setNewClient({
      firstname: '',
      lastname: '',
      email: '',
      company_name: '',
      phone: '',
      mobile: '',
      siret: '',
      notes: ''
    });
    setNewAddress({
      street_number: '',
      street_name: '',
      additional_address: '',
      zip_code: '',
      city: '',
      country: 'France'
    });
    setCreateWithAddress(false);
    setClientToCreate(null);
    setClientWithAddressToCreate(null);
  };

  // Effet pour gérer les résultats des appels API
  React.useEffect(() => {
    // Traiter le résultat de la création de client
    if (createdClient && !creatingClientData) {
      setSelectedClient(createdClient);
      setShowCreateClientForm(false);
      resetForms();
      Alert.alert('Succès', 'Client créé avec succès');
    }
    
    if (createdClientWithAddress && !creatingClientWithAddressData) {
      setSelectedClient(createdClientWithAddress);
      setShowCreateClientForm(false);
      resetForms();
      Alert.alert('Succès', 'Client créé avec succès');
    }
    
    if (createClientError || createClientWithAddressError) {
      Alert.alert('Erreur', 'Impossible de créer le client. Veuillez réessayer.');
      setClientToCreate(null);
      setClientWithAddressToCreate(null);
    }
  }, [createdClient, createdClientWithAddress, creatingClientData, creatingClientWithAddressData, createClientError, createClientWithAddressError]);

  // Fonction pour créer un client
  const handleCreateClient = () => {
    // Validation basique
    if (!newClient.firstname || !newClient.lastname || !newClient.email) {
      Alert.alert('Erreur', 'Veuillez remplir au moins le prénom, le nom et l\'email');
      return;
    }

    if (createWithAddress) {
      // Valider l'adresse si nécessaire
      if (!newAddress.street_name || !newAddress.zip_code || !newAddress.city) {
        Alert.alert('Erreur', 'Veuillez remplir au moins la rue, le code postal et la ville');
        return;
      }

      // Créer client avec adresse
      setClientWithAddressToCreate({
        ...newClient,
        address: newAddress
      });
    } else {
      // Créer client sans adresse
      setClientToCreate(newClient);
    }
  };

  return (
    <>
      {/* Sélection du client */}
      <Text className="text-base font-bold mt-3 mb-2 text-indigo-700">Client *</Text>
      {selectedClient ? (
        <View className="flex-row justify-between items-center p-3 border border-gray-300 rounded-md mb-4 bg-indigo-50">
          <View>
            <Text className="text-base font-bold">{selectedClient.firstname} {selectedClient.lastname}</Text>
            {selectedClient.company_name && (
              <Text className="text-sm text-gray-600">{selectedClient.company_name}</Text>
            )}
          </View>
          <TouchableOpacity 
            className="p-1"
            onPress={() => setShowClientSelection(true)}
          >
            <Text className="text-indigo-700 underline">Changer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          className="flex-row justify-between items-center p-3 border border-indigo-700 rounded-md mb-4"
          onPress={() => setShowClientSelection(true)}
        >
          <Text className="text-indigo-700">Sélectionner un client</Text>
          <Ionicons name="chevron-forward" size={20} color="#3F51B5" />
        </TouchableOpacity>
      )}

      {/* Modale pour la sélection de client */}
      <Modal
        visible={showClientSelection}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClientSelection(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="w-[90%] h-[80%] bg-white rounded-lg p-4 max-w-[500px]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold">Sélectionner un client</Text>
              <TouchableOpacity onPress={() => setShowClientSelection(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            
            <View className="flex-row items-center border border-gray-300 rounded-md mb-4 px-3 bg-gray-50">
              <Ionicons name="search" size={20} color="#888" className="mr-2" />
              <TextInput
                className="flex-1 h-10"
                placeholder="Rechercher un client..."
                value={clientSearchQuery}
                onChangeText={setClientSearchQuery}
              />
            </View>
            
            {clientsLoading ? (
              <ActivityIndicator size="large" color="#3F51B5" className="my-5" />
            ) : clientsError ? (
              <Text className="text-center py-5 text-red-500">Erreur de chargement des clients</Text>
            ) : (
              <>
                <FlatList
                  data={filteredClients}
                  keyExtractor={(item: ClientWithAddress) => item.id?.toString() || Math.random().toString()}
                  renderItem={({ item }: { item: ClientWithAddress }) => (
                    <TouchableOpacity 
                      className="flex-row justify-between items-center p-4 border-b border-gray-200"
                      onPress={() => handleSelectClient(item)}
                    >
                      <View>
                        <Text className="text-base font-medium">{item.firstname} {item.lastname}</Text>
                        {item.company_name && (
                          <Text className="text-sm text-gray-600">{item.company_name}</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#888" />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={() => (
                    <Text className="text-center py-5 text-gray-600">Aucun client trouvé</Text>
                  )}
                />
                
                <TouchableOpacity 
                  className="flex-row items-center justify-center p-4 mt-4 border border-indigo-700 rounded-md"
                  onPress={() => {
                    setShowClientSelection(false);
                    setShowCreateClientForm(true);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#3F51B5" />
                  <Text className="text-indigo-700 font-medium ml-2">Créer un nouveau client</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modale pour la création de client */}
      <Modal
        visible={showCreateClientForm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateClientForm(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="w-[90%] h-[90%] bg-white rounded-lg p-4 max-w-[500px]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold">Créer un nouveau client</Text>
              <TouchableOpacity onPress={() => {
                setShowCreateClientForm(false);
                resetForms();
              }}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 mb-4">
              {/* Informations client */}
              <Text className="text-base font-bold mt-2 mb-2 text-indigo-700">Informations personnelles</Text>
              
              <Text className="text-sm mb-1 text-gray-600">Prénom *</Text>
              <TextInput
                className="h-10 border border-gray-300 rounded-md mb-3 px-3 bg-gray-50"
                placeholder="Prénom"
                value={newClient.firstname}
                onChangeText={(text) => setNewClient({...newClient, firstname: text})}
              />
              
              <Text className="text-sm mb-1 text-gray-600">Nom *</Text>
              <TextInput
                className="h-10 border border-gray-300 rounded-md mb-3 px-3 bg-gray-50"
                placeholder="Nom"
                value={newClient.lastname}
                onChangeText={(text) => setNewClient({...newClient, lastname: text})}
              />
              
              <Text className="text-sm mb-1 text-gray-600">Email *</Text>
              <TextInput
                className="h-10 border border-gray-300 rounded-md mb-3 px-3 bg-gray-50"
                placeholder="Email"
                value={newClient.email}
                onChangeText={(text) => setNewClient({...newClient, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <Text className="text-sm mb-1 text-gray-600">Entreprise</Text>
              <TextInput
                className="h-10 border border-gray-300 rounded-md mb-3 px-3 bg-gray-50"
                placeholder="Entreprise (laisser vide pour particulier)"
                value={newClient.company_name}
                onChangeText={(text) => setNewClient({...newClient, company_name: text})}
              />
              
              <Text className="text-sm mb-1 text-gray-600">Téléphone</Text>
              <TextInput
                className="h-10 border border-gray-300 rounded-md mb-3 px-3 bg-gray-50"
                placeholder="Téléphone fixe"
                value={newClient.phone}
                onChangeText={(text) => setNewClient({...newClient, phone: text})}
                keyboardType="phone-pad"
              />
              
              <Text className="text-sm mb-1 text-gray-600">Mobile</Text>
              <TextInput
                className="h-10 border border-gray-300 rounded-md mb-3 px-3 bg-gray-50"
                placeholder="Téléphone mobile"
                value={newClient.mobile}
                onChangeText={(text) => setNewClient({...newClient, mobile: text})}
                keyboardType="phone-pad"
              />
              
              <Text className="text-sm mb-1 text-gray-600">SIRET</Text>
              <TextInput
                className="h-10 border border-gray-300 rounded-md mb-3 px-3 bg-gray-50"
                placeholder="Numéro SIRET (pour entreprise)"
                value={newClient.siret}
                onChangeText={(text) => setNewClient({...newClient, siret: text})}
              />
              
              <Text className="text-sm mb-1 text-gray-600">Notes</Text>
              <TextInput
                className="h-20 border border-gray-300 rounded-md mb-4 px-3 pt-2 bg-gray-50"
                placeholder="Notes additionnelles"
                value={newClient.notes}
                onChangeText={(text) => setNewClient({...newClient, notes: text})}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Option pour ajouter une adresse */}
              <TouchableOpacity 
                className="flex-row items-center mb-4"
                onPress={() => setCreateWithAddress(!createWithAddress)}
              >
                <View className={`w-5 h-5 border border-indigo-700 rounded-sm mr-2 justify-center items-center ${createWithAddress ? 'bg-indigo-700' : 'bg-white'}`}>
                  {createWithAddress && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <Text className="text-sm text-gray-700">Ajouter également une adresse</Text>
              </TouchableOpacity>

              {/* Formulaire d'adresse (affiché conditionnellement) */}
              {createWithAddress && (
                <>
                  <Text className="text-base font-bold mt-2 mb-2 text-indigo-700">Adresse</Text>
                  
                  <Text className="text-sm mb-1 text-gray-600">Numéro</Text>
                  <TextInput
                    className="h-10 border border-gray-300 rounded-md mb-3 px-3 bg-gray-50"
                    placeholder="Numéro"
                    value={newAddress.street_number}
                    onChangeText={(text) => setNewAddress({...newAddress, street_number: text})}
                  />
                  
                  <Text className="text-sm mb-1 text-gray-600">Rue *</Text>
                  <TextInput
                    className="h-10 border border-gray-300 rounded-md mb-3 px-3 bg-gray-50"
                    placeholder="Rue"
                    value={newAddress.street_name}
                    onChangeText={(text) => setNewAddress({...newAddress, street_name: text})}
                  />
                  
                  <Text className="text-sm mb-1 text-gray-600">Complément d'adresse</Text>
                  <TextInput
                    className="h-10 border border-gray-300 rounded-md mb-3 px-3 bg-gray-50"
                    placeholder="Bâtiment, étage, etc."
                    value={newAddress.additional_address}
                    onChangeText={(text) => setNewAddress({...newAddress, additional_address: text})}
                  />
                  
                  <Text className="text-sm mb-1 text-gray-600">Code postal *</Text>
                  <TextInput
                    className="h-10 border border-gray-300 rounded-md mb-3 px-3 bg-gray-50"
                    placeholder="Code postal"
                    value={newAddress.zip_code}
                    onChangeText={(text) => setNewAddress({...newAddress, zip_code: text})}
                    keyboardType="numeric"
                  />
                  
                  <Text className="text-sm mb-1 text-gray-600">Ville *</Text>
                  <TextInput
                    className="h-10 border border-gray-300 rounded-md mb-3 px-3 bg-gray-50"
                    placeholder="Ville"
                    value={newAddress.city}
                    onChangeText={(text) => setNewAddress({...newAddress, city: text})}
                  />
                  
                  <Text className="text-sm mb-1 text-gray-600">Pays</Text>
                  <TextInput
                    className="h-10 border border-gray-300 rounded-md mb-3 px-3 bg-gray-50"
                    placeholder="Pays"
                    value={newAddress.country}
                    onChangeText={(text) => setNewAddress({...newAddress, country: text})}
                  />
                </>
              )}
            </ScrollView>

            <View className="flex-row justify-between">
              <TouchableOpacity 
                className="flex-1 py-3 mr-2 bg-red-500 rounded-md items-center"
                onPress={() => {
                  setShowCreateClientForm(false);
                  resetForms();
                }}
                disabled={creatingClientData || creatingClientWithAddressData}
              >
                <Text className="text-white font-bold">Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`flex-1 py-3 ml-2 rounded-md items-center ${
                  creatingClientData || creatingClientWithAddressData ? 'bg-gray-400' : 'bg-green-500'
                }`}
                onPress={handleCreateClient}
                disabled={creatingClientData || creatingClientWithAddressData}
              >
                {creatingClientData || creatingClientWithAddressData ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold">Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ClientAddProject;
