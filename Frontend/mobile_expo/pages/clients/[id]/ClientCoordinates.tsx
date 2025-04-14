import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface ClientCoordinatesProps {
  email: string;
  phone?: string;
  mobile?: string;
  isOpen: boolean;
  onToggle: () => void;
  onEmailPress: (email: string) => void;
  onPhonePress: (phone: string) => void;
}

export const ClientCoordinates: React.FC<ClientCoordinatesProps> = ({
  email,
  phone,
  mobile,
  isOpen,
  onToggle,
  onEmailPress,
  onPhonePress
}) => {
  return (
    <View className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full items-center tracking-widest">
      <TouchableOpacity 
        className="flex-row justify-between items-center w-full mb-4"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="contact-phone" size={24} color="#1e40af" />
          <Text className="text-lg font-semibold text-blue-900 ml-2">Coordonnées</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <>
          <View className="mb-3">
            <TouchableOpacity 
              className="flex-row items-center" 
              onPress={() => onEmailPress(email)}
            >
              <Ionicons name="mail" size={24} color="#2563eb" />
              <Text className="ml-3 text-blue-700">{email}</Text>
            </TouchableOpacity>
          </View>

          {phone && (
            <View className="mb-3">
              <TouchableOpacity 
                className="flex-row items-center" 
                onPress={() => onPhonePress(phone)}
              >
                <Ionicons name="call" size={24} color="#2563eb" />
                <Text className="ml-3 text-blue-700">{phone} (Fixe)</Text>
              </TouchableOpacity>
            </View>
          )}

          {mobile && (
            <View className="mb-3">
              <TouchableOpacity 
                className="flex-row items-center" 
                onPress={() => onPhonePress(mobile)}
              >
                <Ionicons name="phone-portrait" size={24} color="#2563eb" />
                <Text className="ml-3 text-blue-700">{mobile} (Mobile)</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}; 