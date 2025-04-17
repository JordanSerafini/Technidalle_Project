import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Client } from '@/app/utils/interfaces/client.interface';
import { url as urlConfig } from '@/app/utils/url';
import { useClientsStore } from '@/app/store/clientsStore';
import { useFetch } from '@/app/hooks/useFetch';

interface AddClientModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (client: Client) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [newClient, setNewClient] = useState<Partial<Client>>({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    company_name: ''
  });

  const [address, setAddress] = useState({
    street_number: '',
    street_name: '',
    additional_address: '',
    zip_code: '',
    city: '',
    country: 'France'
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Récupération des clients du store
  const { clients, setClients } = useClientsStore();
  
  // Hook useFetch pour la création du client
  const { data: createdClient, error: fetchError, loading: fetchLoading } = useFetch<Client>(
    null,
    {
      method: 'POST',
      body: {
        ...newClient,
        address
      }
    }
  );

  // Valider le formulaire client
  const validateClientForm = () => {
    // Vérifier qu'au moins un nom est fourni (company_name ou firstname/lastname)
    if (!newClient.company_name?.trim() && (!newClient.firstname?.trim() || !newClient.lastname?.trim())) {
      setError("Veuillez renseigner soit le nom de la société, soit le prénom et le nom du client");
      return false;
    }

    // Validation du format de l'email si fourni
    if (newClient.email?.trim()) {
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(newClient.email)) {
        setError("Le format de l'email n'est pas valide");
        return false;
      }
    }

    // Validation de l'adresse si tous les champs sont remplis
    if (address.street_number?.trim() || address.street_name?.trim() || 
        address.zip_code?.trim() || address.city?.trim()) {
      if (!address.street_number?.trim()) {
        setError("Le numéro de rue est obligatoire si vous renseignez une adresse");
        return false;
      }
      if (!address.street_name?.trim()) {
        setError("Le nom de la rue est obligatoire si vous renseignez une adresse");
        return false;
      }
      if (!address.zip_code?.trim()) {
        setError("Le code postal est obligatoire si vous renseignez une adresse");
        return false;
      }
      if (!address.city?.trim()) {
        setError("La ville est obligatoire si vous renseignez une adresse");
        return false;
      }
    }

    return true;
  };
  
  // Créer un nouveau client
  const handleCreateClient = async () => {
    if (!validateClientForm()) return;
    
    setError(null);
    
    try {
      const response = await fetch(`${urlConfig.local}clients/with-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newClient,
          address
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création du client');
      }
      
      const createdClient = await response.json();
      
      // Mettre à jour la liste des clients
      if (clients) {
        setClients([...clients, createdClient]);
      }
      
      if (onSuccess) {
        onSuccess(createdClient);
      }
      
      onClose();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };
  
  // Réinitialiser le formulaire
  const resetForm = () => {
    setNewClient({
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      company_name: ''
    });
    setAddress({
      street_number: '',
      street_name: '',
      additional_address: '',
      zip_code: '',
      city: '',
      country: 'France'
    });
    setError(null);
  };
  
  // Fermer la modale et réinitialiser le formulaire
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="absolute inset-0 flex-1 justify-center items-center bg-black/70 z-50">
        <View className="w-[90%] h-[90%] max-w-[500px] max-h-[700px] rounded-xl bg-white overflow-hidden shadow-2xl">
          <View className="flex-1">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-800">Nouveau client</Text>
              <TouchableOpacity onPress={handleClose} className="p-1">
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" contentContainerClassName="p-4">
              {error && (
                <View className="p-2.5 bg-red-50 rounded mb-4">
                  <Text className="text-red-600 text-sm">{error}</Text>
                </View>
              )}

              {/* Formulaire client */}
              <View className="mb-4">
                <Text className="text-lg font-semibold mb-2">Informations client</Text>
                
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 mb-2"
                  placeholder="Nom de la société"
                  value={newClient.company_name}
                  onChangeText={(text) => setNewClient({...newClient, company_name: text})}
                />
                
                <View className="flex-row space-x-2">
                  <TextInput
                    className="flex-1 border border-gray-300 rounded-lg p-2 mb-2"
                    placeholder="Prénom"
                    value={newClient.firstname}
                    onChangeText={(text) => setNewClient({...newClient, firstname: text})}
                  />
                  <TextInput
                    className="flex-1 border border-gray-300 rounded-lg p-2 mb-2"
                    placeholder="Nom"
                    value={newClient.lastname}
                    onChangeText={(text) => setNewClient({...newClient, lastname: text})}
                  />
                </View>
                
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 mb-2"
                  placeholder="Email"
                  value={newClient.email}
                  onChangeText={(text) => setNewClient({...newClient, email: text})}
                  keyboardType="email-address"
                />
                
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 mb-2"
                  placeholder="Téléphone"
                  value={newClient.phone}
                  onChangeText={(text) => setNewClient({...newClient, phone: text})}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Formulaire adresse */}
              <View className="mb-4">
                <Text className="text-lg font-semibold mb-2">Adresse</Text>
                
                <View className="flex-row space-x-2">
                  <TextInput
                    className="w-1/4 border border-gray-300 rounded-lg p-2 mb-2"
                    placeholder="N°"
                    value={address.street_number}
                    onChangeText={(text) => setAddress({...address, street_number: text})}
                  />
                  <TextInput
                    className="flex-1 border border-gray-300 rounded-lg p-2 mb-2"
                    placeholder="Rue"
                    value={address.street_name}
                    onChangeText={(text) => setAddress({...address, street_name: text})}
                  />
                </View>
                
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 mb-2"
                  placeholder="Complément d'adresse"
                  value={address.additional_address}
                  onChangeText={(text) => setAddress({...address, additional_address: text})}
                />
                
                <View className="flex-row space-x-2">
                  <TextInput
                    className="w-1/3 border border-gray-300 rounded-lg p-2 mb-2"
                    placeholder="Code postal"
                    value={address.zip_code}
                    onChangeText={(text) => setAddress({...address, zip_code: text})}
                    keyboardType="number-pad"
                  />
                  <TextInput
                    className="flex-1 border border-gray-300 rounded-lg p-2 mb-2"
                    placeholder="Ville"
                    value={address.city}
                    onChangeText={(text) => setAddress({...address, city: text})}
                  />
                </View>
                
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 mb-2"
                  placeholder="Pays"
                  value={address.country}
                  onChangeText={(text) => setAddress({...address, country: text})}
                />
              </View>

              <View className="flex-row justify-end space-x-2">
                <TouchableOpacity 
                  className="bg-gray-200 px-4 py-2 rounded-lg"
                  onPress={handleClose}
                >
                  <Text>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="bg-blue-500 px-4 py-2 rounded-lg"
                  onPress={handleCreateClient}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white">Créer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddClientModal;
