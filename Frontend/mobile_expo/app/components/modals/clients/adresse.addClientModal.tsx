import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Address {
  street_number: string;
  street_name: string;
  additional_address: string;
  zip_code: string;
  city: string;
  country: string;
}

interface AddressFormProps {
  address: Address;
  setAddress: (address: Address) => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({ address, setAddress }) => {
  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-center mb-2">
        <Ionicons name="location-outline" size={20} color="#3b82f6" />
        <Text className="text-lg font-semibold ml-2 text-center">Adresse</Text>
      </View>
      
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
  );
};

export default AddressForm; 