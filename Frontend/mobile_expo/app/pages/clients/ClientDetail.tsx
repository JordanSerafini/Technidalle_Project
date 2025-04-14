import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Client } from '../../utils/interfaces/client.interface';
import { useFetch } from '../../hooks/useFetch';
import { useClientsStore } from '../../store/clientsStore';
import { Ionicons } from '@expo/vector-icons';

export default function ClientDetail() {
  const router = useRouter();
  const navigation = useNavigation();
  const { selectedClient } = useClientsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: documents, loading: isDocumentsLoading, error: documentsError } = useFetch<Document[]>(`/documents/client/${selectedClient?.id}`);
  console.log(documents);

  // Configuration de l'en-tête
  useEffect(() => {
    if (selectedClient) {
      navigation.setOptions({
        title: `${selectedClient.firstname} ${selectedClient.lastname}`,
        headerBackTitle: 'Retour',
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => router.replace('/clients')}
            style={{ marginLeft: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#2563eb" />
          </TouchableOpacity>
        )
      });
    }
  }, [selectedClient, navigation, router]);

  // Si aucun client n'est sélectionné, afficher un message d'erreur
  if (!selectedClient) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-gray-700 text-center text-lg">Client non trouvé</Text>
        <TouchableOpacity 
          className="mt-6 bg-blue-500 px-4 py-2 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Retour</Text>
        </TouchableOpacity>
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
    const address = client.addresses;
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
              <Text className="text-2xl font-bold text-blue-900">{client.firstname} {client.lastname}</Text>
              <Text className="text-lg italic text-blue-700">{client.company_name}</Text>
            </View>
           
          </View>
          
          {client.siret && (
            <Text className="text-gray-600 mb-2">SIRET: {client.siret}</Text>
          )}
        </View>

        {/* Coordonnées */}
        <View className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full items-center tracking-widest">
          <Text className="text-lg font-semibold mb-4 text-blue-900">Coordonnées</Text>
          
          <View className="mb-3">
            <TouchableOpacity 
              className="flex-row items-center" 
              onPress={() => handleEmail(client.email)}
            >
              <Ionicons name="mail-outline" size={24} color="#2563eb" />
              <Text className="ml-3 text-blue-700">{client.email}</Text>
            </TouchableOpacity>
          </View>

          {client.phone && (
            <View className="mb-3">
              <TouchableOpacity 
                className="flex-row items-center" 
                onPress={() => handleCall(client.phone)}
              >
                <Ionicons name="call-outline" size={24} color="#2563eb" />
                <Text className="ml-3 text-blue-700">{client.phone} (Fixe)</Text>
              </TouchableOpacity>
            </View>
          )}

          {client.mobile && (
            <View className="mb-3">
              <TouchableOpacity 
                className="flex-row items-center" 
                onPress={() => handleCall(client.mobile)}
              >
                <Ionicons name="phone-portrait-outline" size={24} color="#2563eb" />
                <Text className="ml-3 text-blue-700">{client.mobile} (Mobile)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Adresse */}
        {client.addresses && (
          <View className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full items-center tracking-widest">
            <Text className="text-lg font-semibold mb-4 text-blue-900">Adresse</Text>
            
            <View className="mb-2">
              <Text className="text-gray-700">
                {client.addresses.street_number} {client.addresses.street_name}
                {client.addresses.additional_address && `, ${client.addresses.additional_address}`}
              </Text>
              <Text className="text-gray-700">{client.addresses.zip_code} {client.addresses.city}</Text>
              {client.addresses.country && <Text className="text-gray-700">{client.addresses.country}</Text>}
            </View>
            
            <TouchableOpacity 
              className="flex-row items-center mt-2" 
              onPress={handleLocation}
            >
              <Ionicons name="location-outline" size={24} color="#2563eb" />
              <Text className="ml-3 text-blue-700">Voir sur la carte</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes */}
        {client.notes && (
          <View className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full items-center tracking-widest">
            <Text className="text-lg font-semibold mb-4 text-blue-900">Notes</Text>
            <Text className="text-gray-700">{client.notes}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
} 