import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Client } from "@/app/utils/interfaces/client.interface";

interface ClientFormProps {
  client: Partial<Client>;
  setClient: (client: Partial<Client>) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ client, setClient }) => {
  return (
    <View className="flex-1 mb-4">
      <View className="flex flex-row gap-2">
        <Ionicons name="person" size={24} color="#3b82f6" />
        <Text className="text-lg font-semibold mb-2 italic">
          Informations client
        </Text>
      </View>

      <TextInput
        className="border border-gray-300 rounded-lg p-2 mb-2"
        placeholder="Nom de la société"
        value={client.company_name}
        onChangeText={(text) =>
          setClient({ ...client, company_name: text })
        }
      />

      <View className="flex-row space-x-2">
        <TextInput
          className="flex-1 border border-gray-300 rounded-lg p-2 mb-2"
          placeholder="Prénom"
          value={client.firstname}
          onChangeText={(text) =>
            setClient({ ...client, firstname: text })
          }
        />
        <TextInput
          className="flex-1 border border-gray-300 rounded-lg p-2 mb-2"
          placeholder="Nom"
          value={client.lastname}
          onChangeText={(text) =>
            setClient({ ...client, lastname: text })
          }
        />
      </View>

      <TextInput
        className="border border-gray-300 rounded-lg p-2 mb-2"
        placeholder="Email"
        value={client.email}
        onChangeText={(text) =>
          setClient({ ...client, email: text })
        }
        keyboardType="email-address"
      />

      <TextInput
        className="border border-gray-300 rounded-lg p-2 mb-2"
        placeholder="Téléphone"
        value={client.phone}
        onChangeText={(text) =>
          setClient({ ...client, phone: text })
        }
        keyboardType="phone-pad"
      />
    </View>
  );
};

export default ClientForm;
