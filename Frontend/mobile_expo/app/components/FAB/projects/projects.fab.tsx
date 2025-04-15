import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ProjectsFabProps {
  onFilterPress: () => void;
  onAddPress: () => void;
  onEditPress: () => void;
  onOtherPress: () => void;
}

const OFFSET = 65; // Espacement entre les boutons
// Configuration spring plus réactive
const SPRING_CONFIG = {
  damping: 10, // Moins d'amortissement
  stiffness: 150, // Plus de rigidité pour un mouvement plus rapide
  mass: 0.8, // Masse plus légère pour une réaction plus rapide
  overshootClamping: false,
};

export default function ProjectsFab({ onFilterPress, onAddPress, onEditPress, onOtherPress }: ProjectsFabProps) {
  const isExpanded = useSharedValue(false);

  const handleMainButtonPress = () => {
    isExpanded.value = !isExpanded.value;
  };

  // Animation du bouton principal (+/×) - plus rapide
  const mainButtonStyle = useAnimatedStyle(() => {
    const rotate = withTiming(isExpanded.value ? '45deg' : '0deg', {
      duration: 150 // Animation plus rapide
    });
    return {
      transform: [{ rotate }],
    };
  });

  // Fonction pour créer le style animé de chaque bouton secondaire
  const createButtonStyle = (index: number) => {
    return useAnimatedStyle(() => {
      // Animation d'ouverture plus rapide
      const translateY = isExpanded.value 
        ? withSpring(-OFFSET * index, SPRING_CONFIG) 
        : withTiming(0, { duration: 150 }); // Fermeture plus rapide
      
      // Délai réduit pour une apparition plus rapide
      const delayMs = index * 30;
      
      const scale = isExpanded.value 
        ? withDelay(delayMs, withSpring(1, SPRING_CONFIG)) 
        : withTiming(0, { duration: 100 });
      
      const opacity = isExpanded.value 
        ? withDelay(delayMs, withTiming(1, { duration: 100 })) 
        : withTiming(0, { duration: 100 });

      return {
        transform: [{ translateY }, { scale }],
        opacity,
      };
    });
  };

  // Styles animés pour chaque bouton
  const filterButtonStyle = createButtonStyle(1);
  const addButtonStyle = createButtonStyle(2);
  const editButtonStyle = createButtonStyle(3);
  const otherButtonStyle = createButtonStyle(4);

  return (
    <View style={styles.container}>
      {/* Bouton Autres */}
      <AnimatedTouchable 
        style={[styles.button, styles.secondaryButton, otherButtonStyle]}
        onPress={() => {
          onOtherPress();
          isExpanded.value = false;
        }}
        activeOpacity={0.8} // Feedback visuel amélioré
      >
        <Ionicons name="ellipsis-horizontal" size={24} color="white" />
      </AnimatedTouchable>

      {/* Bouton Éditer */}
      <AnimatedTouchable 
        style={[styles.button, styles.secondaryButton, editButtonStyle]}
        onPress={() => {
          onEditPress();
          isExpanded.value = false;
        }}
        activeOpacity={0.8}
      >
        <MaterialIcons name="edit" size={24} color="white" />
      </AnimatedTouchable>

      {/* Bouton Ajouter */}
      <AnimatedTouchable 
        style={[styles.button, styles.secondaryButton, addButtonStyle]}
        onPress={() => {
          onAddPress();
          isExpanded.value = false;
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="white" />
      </AnimatedTouchable>

      {/* Bouton Filtre */}
      <AnimatedTouchable 
        style={[styles.button, styles.secondaryButton, filterButtonStyle]}
        onPress={() => {
          onFilterPress();
          isExpanded.value = false;
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="settings" size={24} color="white" />
      </AnimatedTouchable>

      {/* Bouton principal */}
      <TouchableOpacity 
        style={[styles.button, styles.mainButton]}
        onPress={handleMainButtonPress}
        activeOpacity={0.9}
      >
        <Animated.View style={mainButtonStyle}>
          <Ionicons name="add" size={24} color="white" />
        </Animated.View>
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
    bottom: 0,
    backgroundColor: '#303F9F', // Couleur secondaire (indigo plus foncé)
    zIndex: 905,
  },
});
