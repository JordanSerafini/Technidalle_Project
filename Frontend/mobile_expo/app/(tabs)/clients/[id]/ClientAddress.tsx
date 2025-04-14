import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

interface Address {
  street_number?: string;
  street_name: string;
  additional_address?: string;
  zip_code: string;
  city: string;
  country?: string;
}

interface ClientAddressProps {
  address: Address;
  isOpen: boolean;
  onToggle: () => void;
  onLocationPress: () => void;
}

export const ClientAddress: React.FC<ClientAddressProps> = ({
  address,
  isOpen,
  onToggle,
  onLocationPress
}) => {
  if (!address) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={onToggle}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome5 name="building" size={22} color="#1e40af" />
          </View>
          <Text style={styles.headerTitle}>Adresse</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.content}>
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>
              {address.street_number} {address.street_name}
              {address.additional_address && `, ${address.additional_address}`}
            </Text>
            <Text style={styles.addressText}>{address.zip_code} {address.city}</Text>
            {address.country && <Text style={styles.addressText}>{address.country}</Text>}
          </View>
          
          <TouchableOpacity 
            style={styles.mapButton} 
            onPress={onLocationPress}
          >
            <FontAwesome5 name="map-marked-alt" size={22} color="#2563eb" />
            <Text style={styles.mapButtonText}>Voir sur la carte</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    width: '100%',
    marginBottom: 16
  },
  header: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginLeft: 12
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8
  },
  addressContainer: {
    marginBottom: 8,
    alignItems: 'center'
  },
  addressText: {
    color: '#4b5563'
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  mapButtonText: {
    marginLeft: 12,
    color: '#2563eb'
  }
}); 