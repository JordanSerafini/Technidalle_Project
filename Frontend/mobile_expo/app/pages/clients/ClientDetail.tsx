import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Document } from '@/app/utils/types/document';
import { useFetch } from '../../hooks/useFetch';
import { useClientsStore } from '../../store/clientsStore';
import { Ionicons } from '@expo/vector-icons';

export default function ClientDetail() {
  const router = useRouter();
  const navigation = useNavigation();
  const { selectedClient, setSelectedClient } = useClientsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ne faire le fetch que si selectedClient existe
  const { data: documents, loading: isDocumentsLoading, error: documentsError } = useFetch<Document[]>(
    selectedClient ? `documents/client/${selectedClient.id}` : null
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

  // Configuration de l'en-tête
  useEffect(() => {
    if (selectedClient) {
      navigation.setOptions({
        title: `CLI00${selectedClient.id}`,
        headerBackTitle: 'Retour',
        headerBackVisible: true,
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => {
              console.log("ClientDetail - Clic sur le bouton retour");
              setSelectedClient(null);
              console.log("ClientDetail - Client réinitialisé");
              router.push('/clients');
              console.log("ClientDetail - Navigation vers /clients effectuée");
            }}
            style={{ marginLeft: 10, padding: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#2563eb" />
          </TouchableOpacity>
        )
      });

      // Ajouter un listener pour le focus de l'écran
      const unsubscribe = navigation.addListener('beforeRemove', () => {
        setSelectedClient(null);
      });

      return unsubscribe;
    }
  }, [selectedClient, navigation, router, setSelectedClient]);

  // Si aucun client n'est sélectionné, rediriger vers la liste des clients
  useEffect(() => {
    if (!selectedClient) {
      router.push('/clients');
    }
  }, [selectedClient]);

  // Si aucun client n'est sélectionné, ne rien afficher pendant la redirection
  if (!selectedClient) {
    return null;
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
            <View>
              <Text className="text-2xl font-bold text-blue-900">{selectedClient.firstname} {selectedClient.lastname}</Text>
              <Text className="text-lg italic text-blue-700">{selectedClient.company_name}</Text>
            </View>
           
          </View>
          
          {selectedClient.siret && (
            <Text className="text-gray-600 mb-2">SIRET: {selectedClient.siret}</Text>
          )}
        </View>

        {/* Coordonnées */}
        <View className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full items-center tracking-widest">
          <TouchableOpacity 
            className="flex-row justify-between items-center w-full mb-4"
            onPress={() => toggleSection('coordonnees')}
          >
            <Text className="text-lg font-semibold text-blue-900">Coordonnées</Text>
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
                  <Ionicons name="mail-outline" size={24} color="#2563eb" />
                  <Text className="ml-3 text-blue-700">{selectedClient.email}</Text>
                </TouchableOpacity>
              </View>

              {selectedClient.phone && (
                <View className="mb-3">
                  <TouchableOpacity 
                    className="flex-row items-center" 
                    onPress={() => handleCall(selectedClient.phone)}
                  >
                    <Ionicons name="call-outline" size={24} color="#2563eb" />
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
                    <Ionicons name="phone-portrait-outline" size={24} color="#2563eb" />
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
              <Text className="text-lg font-semibold text-blue-900">Adresse</Text>
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
                  <Ionicons name="location-outline" size={24} color="#2563eb" />
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
            <Text className="text-lg font-semibold text-blue-900">Documents</Text>
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
                documents.map((doc, index) => (
                  <TouchableOpacity 
                    key={index}
                    className="flex-row items-center mb-3 w-full"
                    onPress={() => doc.file_path && Linking.openURL(doc.file_path)}
                  >
                    <Ionicons name="document-outline" size={24} color="#2563eb" />
                    <Text className="ml-3 text-blue-700 flex-1">{doc.reference}</Text>
                    <Text className="text-gray-500 text-sm mr-2">{doc.type}</Text>
                    <Ionicons name="download-outline" size={24} color="#2563eb" />
                  </TouchableOpacity>
                ))
              ) : (
                <Text className="text-gray-500">Aucun document disponible</Text>
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
              <Text className="text-lg font-semibold text-blue-900">Notes</Text>
              <Ionicons 
                name={sections.notes ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#2563eb" 
              />
            </TouchableOpacity>
            
            {sections.notes && (
              <Text className="text-gray-700">{selectedClient.notes}</Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
} 