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

const OFFSET = 56; // Espacement entre les boutons
const SPRING_CONFIG = {
  damping: 12,
  stiffness: 100,
};

export default function ProjectsFab({ onFilterPress, onAddPress, onEditPress, onOtherPress }: ProjectsFabProps) {
  const isExpanded = useSharedValue(false);

  const handleMainButtonPress = () => {
    isExpanded.value = !isExpanded.value;
  };

  // Animation du bouton principal (+/×)
  const mainButtonStyle = useAnimatedStyle(() => {
    const rotate = withTiming(isExpanded.value ? '45deg' : '0deg');
    return {
      transform: [{ rotate }],
    };
  });

  // Fonction pour créer le style animé de chaque bouton secondaire
  const createButtonStyle = (index: number) => {
    return useAnimatedStyle(() => {
      const translateY = isExpanded.value 
        ? withSpring(-OFFSET * index, SPRING_CONFIG) 
        : withTiming(0);
      
      const scale = isExpanded.value 
        ? withDelay(index * 50, withSpring(1, SPRING_CONFIG)) 
        : withTiming(0);
      
      const opacity = isExpanded.value 
        ? withDelay(index * 50, withTiming(1)) 
        : withTiming(0);

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
      >
        <Ionicons name="settings" size={24} color="white" />
      </AnimatedTouchable>

      {/* Bouton principal */}
      <TouchableOpacity 
        style={[styles.button, styles.mainButton]}
        onPress={handleMainButtonPress}
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
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
  },
  mainButton: {
    backgroundColor: '#3F51B5', // Couleur principale (indigo)
    zIndex: 1,
  },
  secondaryButton: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#303F9F', // Couleur secondaire (indigo plus foncé)
    zIndex: 0,
  },
});
