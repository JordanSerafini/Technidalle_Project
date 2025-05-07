import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const EmptyState = () => {
  return (
    <View style={styles.container}>
      <Ionicons name="mail-outline" size={50} color="#9ca3af" style={styles.icon} />
      <Text style={styles.title}>Aucun email prioritaire</Text>
      <Text style={styles.subtitle}>Félicitations ! Vous n'avez pas d'emails prioritaires à traiter aujourd'hui.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  }
});

export default EmptyState; 