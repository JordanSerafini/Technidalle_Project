import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface ProjectsFabProps {
  onFilterPress: () => void;
  onAddPress: () => void;
  onEditPress: () => void;
  onOtherPress: () => void;
}

export default function ProjectsFab({ onFilterPress, onAddPress, onEditPress, onOtherPress }: ProjectsFabProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMainButtonPress = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      {isExpanded && (
        <>
          {/* Bouton Autres */}
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, { bottom: 280 }]}
            onPress={() => {
              onOtherPress();
              setIsExpanded(false);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>

          {/* Bouton Éditer */}
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, { bottom: 210 }]}
            onPress={() => {
              onEditPress();
              setIsExpanded(false);
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="edit" size={24} color="white" />
          </TouchableOpacity>

          {/* Bouton Ajouter */}
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, { bottom: 140 }]}
            onPress={() => {
              onAddPress();
              setIsExpanded(false);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>

          {/* Bouton Filtre */}
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, { bottom: 70 }]}
            onPress={() => {
              onFilterPress();
              setIsExpanded(false);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}

      {/* Bouton principal */}
      <TouchableOpacity 
        style={[styles.button, styles.mainButton]}
        onPress={handleMainButtonPress}
        activeOpacity={0.9}
      >
        <Ionicons 
          name={isExpanded ? "close" : "add"} 
          size={24} 
          color="white" 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 900,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 6,
  },
  mainButton: {
    backgroundColor: '#3F51B5', // Couleur principale (indigo)
    zIndex: 910,
  },
  secondaryButton: {
    position: 'absolute',
    backgroundColor: '#303F9F', // Couleur secondaire (indigo plus foncé)
    zIndex: 905,
  },
});
