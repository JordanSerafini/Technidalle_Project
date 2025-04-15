import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface ProjectsFabProps {
  onFilterPress: () => void;
  onAddPress: () => void;
  onEditPress: () => void;
  onOtherPress: () => void;
}

export default function ProjectsFab({
  onFilterPress,
  onAddPress,
  onEditPress,
  onOtherPress
}: ProjectsFabProps) {
  const [expanded, setExpanded] = useState(false);

  // Basculer l'état d'expansion
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Exécuter une action et fermer le menu
  const handleAction = (callback: () => void) => {
    callback();
    setExpanded(false);
  };

  return (
    <View style={[styles.container, { pointerEvents: 'box-none' }]}>
      {/* Menu secondaire - visible uniquement quand expanded est true */}
      {expanded && (
        <>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, styles.position4]}
            onPress={() => handleAction(onOtherPress)}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, styles.position3]}
            onPress={() => handleAction(onEditPress)}
          >
            <MaterialIcons name="edit" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, styles.position2]}
            onPress={() => handleAction(onAddPress)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, styles.position1]}
            onPress={() => handleAction(onFilterPress)}
          >
            <Ionicons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}
      
      {/* Bouton principal - toujours visible */}
      <TouchableOpacity 
        style={[styles.button, styles.mainButton]}
        onPress={toggleExpanded}
      >
        <Ionicons 
          name={expanded ? "close" : "add"} 
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
    justifyContent: 'flex-end',
    zIndex: 5,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  mainButton: {
    backgroundColor: '#3F51B5',
    zIndex: 1,
  },
  secondaryButton: {
    position: 'absolute',
    backgroundColor: '#303F9F',
    zIndex: 0,
  },
  position1: {
    bottom: 70, // 56 (taille du bouton) + 14 (espace)
    right: 0,
  },
  position2: {
    bottom: 140, // 56*2 + 14*2
    right: 0,
  },
  position3: {
    bottom: 210, // 56*3 + 14*3
    right: 0,
  },
  position4: {
    bottom: 280, // 56*4 + 14*4
    right: 0,
  },
});
