import React from 'react';
import { View, Text, TouchableHighlight, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AccordionItem from '../../../components/AccordionItem';
import { Address, ProjectAddress as ProjectAddressType } from '@/app/utils/interfaces/project.interface';
import { AddressType } from '@/app/utils/interfaces/client.interface';

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
      <View>
        <Text className="text-gray-800">
          {address.street_number && `${address.street_number} `}
          {address.street_name}
        </Text>
        
        {address.additional_address && (
          <Text className="text-gray-800">{address.additional_address}</Text>
        )}
        
        <Text className="text-gray-800">
          {address.zip_code} {address.city}
        </Text>
        
        {address.country && (
          <Text className="text-gray-800">{address.country}</Text>
        )}
      </View>
      
      <TouchableOpacity 
        className="flex-row items-center mt-3 bg-blue-500 py-2 px-4 rounded-lg self-start"
        onPress={() => onLocationPress(address)}
      >
        <MaterialIcons name="location-on" size={18} color="white" />
        <Text className="text-white ml-1 font-medium">Voir sur la carte</Text>
      </TouchableOpacity>
    </View>
  );
};

interface ProjectAddressProps {
  addresses: Address | ProjectAddressType[];
  isOpen: boolean;
  onToggle: () => void;
  onLocationPress: (address: Address) => void;
  onAddAddress?: () => void;
}

export const ProjectAddress: React.FC<ProjectAddressProps> = ({
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
    <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
      <TouchableHighlight
        onPress={onToggle}
        underlayColor="#f0f0f0"
        style={{
          borderRadius: 8,
          marginHorizontal: -8,
          marginVertical: -8,
          padding: 8
        }}
      >
        <View className="flex-row justify-between items-center py-2">
          <View className="flex-row items-center">
            <MaterialIcons name="location-on" size={22} color="#1e40af" />
            <Text className="text-lg font-bold ml-2">
              {isSingleAddress ? "Adresse du chantier" : "Adresses du chantier"}
            </Text>
          </View>
          <Ionicons 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#2563eb" 
          />
        </View>
      </TouchableHighlight>
      
      <AccordionItem isExpanded={isOpen}>
        <View className="mt-4">
          {isSingleAddress ? (
            // Affichage d'une seule adresse
            <AddressItem 
              address={addresses as Address} 
              onLocationPress={onLocationPress} 
            />
          ) : (
            // Affichage de plusieurs adresses avec leur type
            <FlatList
              data={addresses as ProjectAddressType[]}
              keyExtractor={(item: ProjectAddressType) => item.id?.toString() || `${item.project_id}-${item.address_id}`}
              renderItem={({ item }: { item: ProjectAddressType }) => (
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
              className="flex-row items-center justify-center mt-3 py-2 bg-blue-500 rounded-lg"
              onPress={onAddAddress}
            >
              <MaterialIcons name="add-location" size={20} color="white" />
              <Text className="ml-2 text-white font-medium">Ajouter une adresse</Text>
            </TouchableOpacity>
          )}
        </View>
      </AccordionItem>
    </View>
  );
}; 

export default ProjectAddress;