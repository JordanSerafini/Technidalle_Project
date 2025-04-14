import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Linking, Alert } from 'react-native';
import { useFetch } from '../../hooks/useFetch';
import { Client } from '../../utils/interfaces/client.interface';
import { Ionicons } from '@expo/vector-icons';
import { useClientsStore } from '../../store/clientsStore';
import { useRouter } from 'expo-router';

export function Clients() {
  const router = useRouter();
  const { clients, setClients, setSelectedClient } = useClientsStore();
  const { data, loading, error } = useFetch<Client[]>('clients', { limit: 20 });
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedClientForModal, setSelectedClientForModal] = useState<Client | null>(null);

  // Stocker les données dans le store une fois chargées
  useEffect(() => {
    if (data && !loading) {
      setClients(data);
    }
  }, [data, loading, setClients]);

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
    
    // Redirection directe vers la page de détail sans passer par ClientDetailRedirect
    router.replace('/pages/clients/ClientDetail');
  };

  return (
    <View className="flex-1 p-4">
     
      <ScrollView className="w-full">
        <View className="bg-white p-4 rounded shadow w-full">
          {clients && clients.length > 0 ? (
            clients.map((client: Client) => (
              <TouchableOpacity 
                key={client.id} 
                onPress={() => navigateToClientDetail(client)}
                className="flex flex-row justify-between w-full mb-2 p-2 border-b"
              >
                {/* Nom et société */}
                <View className="flex-col gap-y-1">
                  <Text className="font-bold text-blue-900">
                    {client.firstname} {client.lastname}
                  </Text>
                  <Text className={`font-thin tracking-wide italic ${client.company_name == "Particulier" ? 'text-green-700' : 'text-blue-700'}`}>
                    {client.company_name}
                  </Text>
                </View>
                {/* Boutons pour appeler et envoyer un email */}
                <View className="flex-row gap-x-3">
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
    </View>
  );
} 

export default Clients;