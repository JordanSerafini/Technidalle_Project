import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, Linking, Alert, Platform } from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { Document } from '@/app/utils/types/document';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import useFetch from '@/app/hooks/useFetch';
import { useClientsStore } from '@/app/store/clientsStore';

export default function ClientDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedClient, setSelectedClient, clients, setClients } = useClientsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Utiliser l'ID du paramètre d'URL
  const clientId = id || (selectedClient?.id?.toString() || null);
  
  // Charger le client depuis l'API si nécessaire
  useEffect(() => {
    if (clientId && !selectedClient) {
      setLoading(true);
      fetch(`${process.env.EXPO_PUBLIC_API_URL}/clients/${clientId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Erreur lors du chargement du client');
          }
          return response.json();
        })
        .then(data => {
          setSelectedClient(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [clientId, selectedClient]);
  
  // Ne faire le fetch des documents que si un client est sélectionné
  const { data: documents, loading: isDocumentsLoading, error: documentsError } = useFetch<Document[]>(
    clientId ? `documents/client/${clientId}` : null
  );

  // États pour gérer l'ouverture/fermeture des sections
  const [sections, setSections] = useState({
    coordonnees: false,
    adresse: false,
    documents: false,
    notes: false
  });

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleBack = () => {
    setSelectedClient(null);
    router.back();
  };

  // Configuration de l'en-tête
  useEffect(() => {
    if (selectedClient) {
      navigation.setOptions({
        title: `CLI00${selectedClient.id}`,
        // La flèche de retour standard sera utilisée automatiquement
      });

      // Ajouter un listener pour le focus de l'écran
      const unsubscribe = navigation.addListener('beforeRemove', () => {
        setSelectedClient(null);
      });

      return unsubscribe;
    }
  }, [selectedClient, navigation, router]);

  // État de chargement
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-4 text-gray-600">Chargement du client...</Text>
      </View>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-500">Erreur: {error}</Text>
        <TouchableOpacity 
          onPress={() => router.navigate('/(tabs)/clients')}
          className="mt-4 bg-blue-500 p-3 rounded-lg"
        >
          <Text className="text-white">Retour à la liste des clients</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Si aucun client n'est sélectionné, ne rien afficher pendant la redirection
  if (!selectedClient) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-4 text-gray-600">Chargement...</Text>
      </View>
    );
  }

  const client = selectedClient;

  const handleCall = (phoneNumber: string | undefined) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("Information", "Numéro de téléphone non disponible");
    }
  };

  const handleEmail = (email: string | undefined) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    } else {
      Alert.alert("Information", "Adresse email non disponible");
    }
  };

  const handleLocation = () => {
    const address = selectedClient.addresses;
    if (address?.latitude && address?.longitude) {
      const url = `https://maps.google.com/?q=${address.latitude},${address.longitude}`;
      Linking.openURL(url);
    } else if (address) {
      const query = `${address.street_number || ''} ${address.street_name}, ${address.zip_code} ${address.city}, ${address.country || 'France'}`;
      const url = `https://maps.google.com/?q=${encodeURIComponent(query)}`;
      Linking.openURL(url);
    } else {
      Alert.alert("Information", "Adresse non disponible");
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4">

        
        {/* En-tête du client */}
        <View className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full items-center tracking-widest">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <FontAwesome5 name="user-tie" size={28} color="#1e40af" />
              <View className="ml-3">
                <Text className="text-2xl font-bold text-blue-900">{selectedClient.firstname} {selectedClient.lastname}</Text>
                <Text className="text-lg italic text-blue-700">{selectedClient.company_name}</Text>
              </View>
            </View>
           
          </View>
          
          {selectedClient.siret && (
            <View className="flex-row h-fit flex items-center mt-2">
              <MaterialCommunityIcons name="identifier" size={20} color="#64748b" />
              <Text className="text-gray-600 mb-2 ml-2">SIRET: {selectedClient.siret}</Text>
            </View>
          )}
        </View>

        {/* Coordonnées */}
        <View className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full items-center tracking-widest">
          <TouchableOpacity 
            className="flex-row justify-between items-center w-full mb-4"
            onPress={() => toggleSection('coordonnees')}
          >
            <View className="flex-row items-center">
              <MaterialIcons name="contact-phone" size={24} color="#1e40af" />
              <Text className="text-lg font-semibold text-blue-900 ml-2">Coordonnées</Text>
            </View>
            <Ionicons 
              name={sections.coordonnees ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#2563eb" 
            />
          </TouchableOpacity>
          
          {sections.coordonnees && (
            <>
              <View className="mb-3">
                <TouchableOpacity 
                  className="flex-row items-center" 
                  onPress={() => handleEmail(selectedClient.email)}
                >
                  <Ionicons name="mail" size={24} color="#2563eb" />
                  <Text className="ml-3 text-blue-700">{selectedClient.email}</Text>
                </TouchableOpacity>
              </View>

              {selectedClient.phone && (
                <View className="mb-3">
                  <TouchableOpacity 
                    className="flex-row items-center" 
                    onPress={() => handleCall(selectedClient.phone)}
                  >
                    <Ionicons name="call" size={24} color="#2563eb" />
                    <Text className="ml-3 text-blue-700">{selectedClient.phone} (Fixe)</Text>
                  </TouchableOpacity>
                </View>
              )}

              {selectedClient.mobile && (
                <View className="mb-3">
                  <TouchableOpacity 
                    className="flex-row items-center" 
                    onPress={() => handleCall(selectedClient.mobile)}
                  >
                    <Ionicons name="phone-portrait" size={24} color="#2563eb" />
                    <Text className="ml-3 text-blue-700">{selectedClient.mobile} (Mobile)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* Adresse */}
        {selectedClient.addresses && (
          <View className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full items-center tracking-widest">
            <TouchableOpacity 
              className="flex-row justify-between items-center w-full mb-4"
              onPress={() => toggleSection('adresse')}
            >
              <View className="flex-row items-center">
                <FontAwesome5 name="building" size={22} color="#1e40af" />
                <Text className="text-lg font-semibold text-blue-900 ml-2">Adresse</Text>
              </View>
              <Ionicons 
                name={sections.adresse ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#2563eb" 
              />
            </TouchableOpacity>
            
            {sections.adresse && (
              <>
                <View className="mb-2">
                  <Text className="text-gray-700">
                    {selectedClient.addresses.street_number} {selectedClient.addresses.street_name}
                    {selectedClient.addresses.additional_address && `, ${selectedClient.addresses.additional_address}`}
                  </Text>
                  <Text className="text-gray-700">{selectedClient.addresses.zip_code} {selectedClient.addresses.city}</Text>
                  {selectedClient.addresses.country && <Text className="text-gray-700">{selectedClient.addresses.country}</Text>}
                </View>
                
                <TouchableOpacity 
                  className="flex-row items-center mt-2" 
                  onPress={handleLocation}
                >
                  <FontAwesome5 name="map-marked-alt" size={22} color="#2563eb" />
                  <Text className="ml-3 text-blue-700">Voir sur la carte</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Documents */}
        <View className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full items-center tracking-widest">
          <TouchableOpacity 
            className="flex-row justify-between items-center w-full mb-4"
            onPress={() => toggleSection('documents')}
          >
            <View className="flex-row items-center">
              <MaterialIcons name="folder" size={24} color="#1e40af" />
              <Text className="text-lg font-semibold text-blue-900 ml-2">Documents</Text>
            </View>
            <Ionicons 
              name={sections.documents ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#2563eb" 
            />
          </TouchableOpacity>
          
          {sections.documents && (
            <>
              {isDocumentsLoading ? (
                <ActivityIndicator size="large" color="#2563eb" />
              ) : documentsError ? (
                <Text className="text-red-500">Erreur lors du chargement des documents</Text>
              ) : documents && documents.length > 0 ? (
                documents.map((doc: any, index: number) => (
                  <TouchableOpacity 
                    key={index}
                    className="flex-row items-center mb-3 w-full"
                    onPress={() => doc.file_path && Linking.openURL(doc.file_path)}
                  >
                    <MaterialCommunityIcons 
                      name={
                        doc.type === 'facture' 
                          ? "file-document-outline" 
                          : doc.type === 'devis' 
                            ? "file-chart-outline" 
                            : "file-document-outline"
                      } 
                      size={24} 
                      color="#2563eb" 
                    />
                    <Text className="ml-3 text-blue-700 flex-1">{doc.reference}</Text>
                    <Text className="text-gray-500 text-sm mr-2">{doc.type}</Text>
                    <MaterialIcons name="file-download" size={24} color="#2563eb" />
                  </TouchableOpacity>
                ))
              ) : (
                <View className="flex-row items-center">
                  <MaterialIcons name="info-outline" size={20} color="#64748b" />
                  <Text className="text-gray-500 ml-2">Aucun document disponible</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Notes */}
        {selectedClient.notes && (
          <View className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full items-center tracking-widest">
            <TouchableOpacity 
              className="flex-row justify-between items-center w-full mb-4"
              onPress={() => toggleSection('notes')}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="sticky-note-2" size={24} color="#1e40af" />
                <Text className="text-lg font-semibold text-blue-900 ml-2">Notes</Text>
              </View>
              <Ionicons 
                name={sections.notes ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#2563eb" 
              />
            </TouchableOpacity>
            
            {sections.notes && (
              <View className="flex-row">
                <MaterialIcons name="format-quote" size={20} color="#64748b" style={{alignSelf: 'flex-start'}} />
                <Text className="text-gray-700 ml-2 flex-1">{selectedClient.notes}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Spécifier explicitement les propriétés pour le routage Expo
ClientDetailScreen.displayName = 'ClientDetailScreen'; 