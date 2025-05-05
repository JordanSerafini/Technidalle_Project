import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { ClientAddress as ClientAddressType, Address, AddressType } from '@/app/utils/interfaces/client.interface';

interface AddressItemProps {
  address: Address;
  type?: AddressType;
  isDefault?: boolean;
  onLocationPress: (address: Address) => void;
}

const AddressItem: React.FC<AddressItemProps> = ({ address, type, isDefault, onLocationPress }) => {
  if (!address) return null;

  // Fonction pour afficher le type d'adresse de façon plus lisible
  const getAddressTypeLabel = (type?: AddressType) => {
    if (!type) return "";
    switch (type) {
      case AddressType.FACTURATION: return "Facturation";
      case AddressType.LIVRAISON: return "Livraison";
      case AddressType.SIEGE_SOCIAL: return "Siège social";
      case AddressType.CHANTIER: return "Chantier";
      case AddressType.DOMICILE: return "Domicile";
      case AddressType.AUTRE: return "Autre";
      default: return "";
    }
  };

  return (
    <View className="mb-3 p-3 bg-gray-50 rounded-md">
      {type && (
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-blue-600 font-medium">{getAddressTypeLabel(type)}</Text>
          {isDefault && <Text className="text-green-600 text-xs font-medium">Adresse principale</Text>}
        </View>
      )}
      <View className="mb-2">
        <Text className="text-gray-700">
          {address.street_number} {address.street_name}
          {address.additional_address && `, ${address.additional_address}`}
        </Text>
        <Text className="text-gray-700">{address.zip_code} {address.city}</Text>
        {address.country && <Text className="text-gray-700">{address.country}</Text>}
      </View>
      
      <TouchableOpacity 
        className="flex-row items-center mt-2" 
        onPress={() => onLocationPress(address)}
      >
        <FontAwesome5 name="map-marked-alt" size={22} color="#2563eb" />
        <Text className="ml-3 text-blue-700">Voir sur la carte</Text>
      </TouchableOpacity>
    </View>
  );
};

interface ClientAddressProps {
  addresses: Address | ClientAddressType[];
  isOpen: boolean;
  onToggle: () => void;
  onLocationPress: (address: Address) => void;
  onAddAddress?: () => void;
}

export const ClientAddress: React.FC<ClientAddressProps> = ({
  addresses,
  isOpen,
  onToggle,
  onLocationPress,
  onAddAddress
}) => {
  if (!addresses) return null;

  // Détermine si nous avons une seule adresse ou plusieurs
  const isSingleAddress = !Array.isArray(addresses);
  const hasAddresses = isSingleAddress || addresses.length > 0;

  if (!hasAddresses) return null;

  return (
    <View className="bg-white rounded-lg shadow-sm w-full mb-4">
      <TouchableOpacity 
        className="p-3 flex-row justify-between items-center w-full"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <View className="w-8 h-8 flex items-center justify-center">
            <FontAwesome5 name="building" size={22} color="#1e40af" />
          </View>
          <Text className="text-lg font-semibold text-blue-900 ml-3">
            {isSingleAddress ? "Adresse" : "Adresses"}
          </Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View className="px-4 pb-4 w-full">
          {isSingleAddress ? (
            // Affichage d'une seule adresse
            <AddressItem 
              address={addresses as Address} 
              onLocationPress={onLocationPress} 
            />
          ) : (
            // Affichage de plusieurs adresses avec leur type
            <FlatList
              data={addresses as ClientAddressType[]}
              keyExtractor={(item: ClientAddressType) => item.id?.toString() || `${item.client_id}-${item.address_id}`}
              renderItem={({ item }: { item: ClientAddressType }) => (
                <AddressItem 
                  address={item.address || {} as Address}
                  type={item.address_type}
                  isDefault={item.is_default}
                  onLocationPress={onLocationPress}
                />
              )}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text className="text-gray-500 italic text-center py-2">Aucune adresse enregistrée</Text>
              }
            />
          )}
          
          {/* Bouton d'ajout d'adresse */}
          {onAddAddress && (
            <TouchableOpacity 
              className="flex-row items-center justify-center mt-3 bg-blue-50 border border-blue-300 rounded-lg py-2"
              onPress={onAddAddress}
            >
              <Ionicons name="add-circle-outline" size={20} color="#2563eb" />
              <Text className="ml-2 text-blue-700 font-medium">Ajouter une adresse</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}; 

export default ClientAddress;