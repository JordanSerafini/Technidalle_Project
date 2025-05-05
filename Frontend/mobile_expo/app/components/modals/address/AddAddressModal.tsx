import React, { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AddressType, CreateAddressDto } from '@/app/utils/interfaces/client.interface';

interface AddAddressModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (addressData: { 
    address: CreateAddressDto; 
    address_type: AddressType;
    is_default: boolean;
  }) => void;
  entityId: number; // client_id ou project_id
  isProject?: boolean;
}

const AddAddressModal: React.FC<AddAddressModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  entityId,
  isProject = false
}) => {
  // État initial pour les champs du formulaire
  const [address, setAddress] = useState<CreateAddressDto>({
    street_number: '',
    street_name: '',
    additional_address: '',
    zip_code: '',
    city: '',
    country: 'France',
  });
  
  const [addressType, setAddressType] = useState<AddressType>(
    isProject ? AddressType.CHANTIER : AddressType.FACTURATION
  );
  
  const [isDefault, setIsDefault] = useState<boolean>(true);
  
  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setAddress({
      street_number: '',
      street_name: '',
      additional_address: '',
      zip_code: '',
      city: '',
      country: 'France',
    });
    setAddressType(isProject ? AddressType.CHANTIER : AddressType.FACTURATION);
    setIsDefault(true);
  };
  
  // Fonction pour fermer le modal
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  // Fonction pour soumettre le formulaire
  const handleSubmit = () => {
    // Vérification des champs obligatoires
    if (!address.street_name || !address.zip_code || !address.city) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    onSubmit({
      address,
      address_type: addressType,
      is_default: isDefault
    });
    
    handleClose();
  };
  
  // Fonction pour obtenir le libellé d'un type d'adresse
  const getAddressTypeLabel = (type: AddressType): string => {
    switch (type) {
      case AddressType.FACTURATION: return "Facturation";
      case AddressType.LIVRAISON: return "Livraison";
      case AddressType.SIEGE_SOCIAL: return "Siège social";
      case AddressType.CHANTIER: return "Chantier";
      case AddressType.DOMICILE: return "Domicile";
      case AddressType.AUTRE: return "Autre";
      default: return ""; // pour satisfaire TypeScript
    }
  };
  
  // Options de type d'adresse
  const addressTypeOptions = [
    AddressType.FACTURATION,
    AddressType.LIVRAISON, 
    AddressType.SIEGE_SOCIAL,
    AddressType.CHANTIER,
    AddressType.DOMICILE,
    AddressType.AUTRE
  ];
  
  // Liste des types d'adresse selon l'entité (client ou projet)
  const displayAddressTypeOptions = isProject 
    ? [AddressType.CHANTIER, AddressType.FACTURATION, AddressType.LIVRAISON, AddressType.AUTRE]
    : addressTypeOptions;
  
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-xl p-5 max-h-[90%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">
              {isProject ? "Ajouter une adresse au projet" : "Ajouter une adresse au client"}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close-circle-outline" size={24} color="#888" />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Type d'adresse */}
            <View className="mb-4">
              <Text className="text-base font-semibold mb-2">Type d'adresse</Text>
              <View className="flex-row flex-wrap">
                {displayAddressTypeOptions.map((type) => (
                  <TouchableOpacity 
                    key={type} 
                    onPress={() => setAddressType(type)}
                    className={`rounded-full px-4 py-2 m-1 ${addressType === type ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <Text className={`font-medium ${addressType === type ? 'text-white' : 'text-gray-700'}`}>
                      {getAddressTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Option adresse par défaut */}
            <View className="flex-row items-center mb-4">
              <TouchableOpacity 
                onPress={() => setIsDefault(!isDefault)}
                className="flex-row items-center"
              >
                <View className={`w-6 h-6 rounded-md mr-2 border ${isDefault ? 'bg-blue-600 border-blue-600' : 'border-gray-400'} justify-center items-center`}>
                  {isDefault && <Ionicons name="checkmark" size={18} color="white" />}
                </View>
                <Text className="text-base">Définir comme adresse par défaut</Text>
              </TouchableOpacity>
            </View>
            
            {/* Formulaire d'adresse */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="location-outline" size={20} color="#3b82f6" />
                <Text className="text-lg font-semibold ml-2">Informations de l'adresse</Text>
              </View>
              
              <View className="space-y-4">
                <View className="flex-row space-x-2">
                  <View className="w-1/4">
                    <Text className="text-sm text-gray-600 mb-1">Numéro</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-2"
                      placeholder="N°"
                      value={address.street_number}
                      onChangeText={(text) => setAddress({...address, street_number: text})}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-600 mb-1">Rue *</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-2"
                      placeholder="Rue"
                      value={address.street_name}
                      onChangeText={(text) => setAddress({...address, street_name: text})}
                    />
                  </View>
                </View>
                
                <View>
                  <Text className="text-sm text-gray-600 mb-1">Complément d'adresse</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-2"
                    placeholder="Bâtiment, étage, etc."
                    value={address.additional_address}
                    onChangeText={(text) => setAddress({...address, additional_address: text})}
                  />
                </View>
                
                <View className="flex-row space-x-2">
                  <View className="w-1/3">
                    <Text className="text-sm text-gray-600 mb-1">Code postal *</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-2"
                      placeholder="Code postal"
                      value={address.zip_code}
                      onChangeText={(text) => setAddress({...address, zip_code: text})}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-600 mb-1">Ville *</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-2"
                      placeholder="Ville"
                      value={address.city}
                      onChangeText={(text) => setAddress({...address, city: text})}
                    />
                  </View>
                </View>
                
                <View>
                  <Text className="text-sm text-gray-600 mb-1">Pays</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-2"
                    placeholder="Pays"
                    value={address.country}
                    onChangeText={(text) => setAddress({...address, country: text})}
                  />
                </View>
              </View>
            </View>
            
            {/* Boutons d'action */}
            <View className="flex-row justify-end space-x-2 mt-6 mb-4">
              <TouchableOpacity 
                className="bg-gray-200 px-4 py-2 rounded-lg"
                onPress={handleClose}
              >
                <Text className="text-gray-800 font-medium">Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-blue-600 px-4 py-2 rounded-lg"
                onPress={handleSubmit}
              >
                <Text className="text-white font-medium">Ajouter</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default AddAddressModal; 