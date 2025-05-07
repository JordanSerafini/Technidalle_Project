import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const LoadingState = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3b82f6" style={styles.spinner} />
      <Text style={styles.text}>Chargement des résumés d'emails...</Text>
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
        <Text style={styles.infoText}>Analyse en cours des messages importants</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginVertical: 16,
  },
  spinner: {
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  }
});

export default LoadingState; 