import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Linking, Alert } from 'react-native';
import { useFetch } from '../hooks/useFetch';
import { Client } from '../utils/interfaces/client.interface';
import { Ionicons } from '@expo/vector-icons';

export function Clients() {
  const { data, loading, error } = useFetch<Client[]>('clients', { limit: 10 });
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Log de l'état de chargement
  if (loading) {
    return (
      <View className="flex items-center justify-center h-full">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="text-gray-600 mt-4">Chargement...</Text>
      </View>
    );
  }

  // Log des erreurs
  if (error) {
    return (
      <View className="flex items-center justify-center h-full">
        <Text className="text-red-500">Erreur: {error}</Text>
      </View>
    );
  }

  const handlePhonePress = (client: Client) => {
    setSelectedClient(client);
    
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

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View className="flex-1 p-4">

      
      <ScrollView className="w-full">
        <View className="bg-white p-4 rounded shadow w-full">
          {data && data.length > 0 ? (
            data.map((client: Client) => (
              <View key={client.id} className="mb-2 p-2 border-b">
                <View className="flex-row w-full justify-between">
                  <Text className="font-medium text-blue-900">
                    {client.company_name}
                  </Text>
                  <Text className="font-medium">
                    {client.firstname} {client.lastname}
                  </Text>
                </View>
                <View className="flex-row justify-start mt-2 space-x-3">
                  {(client.phone || client.mobile) && (
                    <TouchableOpacity onPress={() => handlePhonePress(client)}>
                      <Ionicons name="call-outline" size={24} color="#2563eb" />
                    </TouchableOpacity>
                  )}
                  {client.email && (
                    <TouchableOpacity onPress={() => handleEmailPress(client.email)}>
                      <Ionicons name="mail-outline" size={24} color="#2563eb" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">Aucun client trouvé</Text>
          )}
        </View>
      </ScrollView>

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
            
            {selectedClient?.phone && (
              <TouchableOpacity 
                className="flex-row items-center p-3 border-b border-gray-200"
                onPress={() => handleCall(selectedClient.phone || '')}
              >
                <Ionicons name="call-outline" size={24} color="#2563eb" />
                <Text className="ml-3">{selectedClient.phone} (Fixe)</Text>
              </TouchableOpacity>
            )}
            
            {selectedClient?.mobile && (
              <TouchableOpacity 
                className="flex-row items-center p-3"
                onPress={() => handleCall(selectedClient.mobile || '')}
              >
                <Ionicons name="phone-portrait-outline" size={24} color="#2563eb" />
                <Text className="ml-3">{selectedClient.mobile} (Mobile)</Text>
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
    </View>
  );
} 

export default Clients;