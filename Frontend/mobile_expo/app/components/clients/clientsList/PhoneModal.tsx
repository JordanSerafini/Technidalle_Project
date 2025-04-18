import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Client } from '@/app/utils/interfaces/client.interface';

interface PhoneModalProps {
  visible: boolean;
  client: Client | null;
  onClose: () => void;
  onCall: (phone: string) => void;
}

const PhoneModal = React.memo(({ 
  visible, 
  client, 
  onClose, 
  onCall 
}: PhoneModalProps) => {
  if (!client) return null;
  
  const handleCallFixed = useCallback(() => {
    if (client.phone) onCall(client.phone);
  }, [client, onCall]);
  
  const handleCallMobile = useCallback(() => {
    if (client.mobile) onCall(client.mobile);
  }, [client, onCall]);
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-lg p-4 w-80">
          <Text className="text-lg font-bold mb-4 text-center">Choisir un numéro</Text>
          
          {client.phone && (
            <TouchableOpacity 
              className="flex-row items-center p-3 border-b border-gray-200"
              onPress={handleCallFixed}
            >
              <Ionicons name="call-outline" size={24} color="#2563eb" />
              <Text className="ml-3">{client.phone} (Fixe)</Text>
            </TouchableOpacity>
          )}
          
          {client.mobile && (
            <TouchableOpacity 
              className="flex-row items-center p-3"
              onPress={handleCallMobile}
            >
              <Ionicons name="phone-portrait-outline" size={24} color="#2563eb" />
              <Text className="ml-3">{client.mobile} (Mobile)</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            className="mt-4 p-3 bg-gray-200 rounded-lg"
            onPress={onClose}
          >
            <Text className="text-center">Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}, (prevProps, nextProps) => {
  // Ne re-rendre que si la visibilité change ou le client change d'ID
  return prevProps.visible === nextProps.visible && 
         prevProps.client?.id === nextProps.client?.id;
});

export default PhoneModal; 