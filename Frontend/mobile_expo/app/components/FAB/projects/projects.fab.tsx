import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

// Configuration pour l'animation
const SPRING_CONFIG = {
  damping: 80,
  overshootClamping: true,
  restDisplacementThreshold: 0.1,
  restSpeedThreshold: 0.1,
  stiffness: 500,
};

// Décalage vertical entre les boutons
const BUTTON_OFFSET = 60;

// Créer un Pressable animé
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Propriétés pour les boutons FAB secondaires
interface FABButtonProps {
  isExpanded: Animated.SharedValue<boolean>;
  index: number;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  visible: boolean;
}

// Propriétés pour le composant ProjectsFAB
interface ProjectsFABProps {
  filtersVisible?: boolean;
  onAddPress: () => void;
  onEditPress: () => void;
  onOtherPress: () => void;
}

// Composant pour les boutons secondaires
const FABButton: React.FC<FABButtonProps> = ({ 
  isExpanded, 
  index, 
  icon, 
  label, 
  onPress,
  visible
}) => {
  const animatedStyles = useAnimatedStyle(() => {
    const moveValue = isExpanded.value ? BUTTON_OFFSET * index : 0;
    const translateValue = withSpring(-moveValue, SPRING_CONFIG);
    const delay = index * 100;
    const scaleValue = isExpanded.value ? 1 : 0;
    const opacityValue = isExpanded.value ? 1 : 0;

    return {
      transform: [
        { translateY: translateValue },
        { scale: withDelay(delay, withTiming(scaleValue, { duration: 200 })) },
      ],
      opacity: withDelay(delay, withTiming(opacityValue, { duration: 200 })),
    };
  });

  const labelAnimatedStyle = useAnimatedStyle(() => {
    const moveValue = isExpanded.value ? BUTTON_OFFSET * index : 0;
    const translateValue = withSpring(-moveValue, SPRING_CONFIG);
    const delay = index * 100;
    const opacityValue = isExpanded.value ? 1 : 0;

    return {
      transform: [{ translateY: translateValue }],
      opacity: withDelay(delay, withTiming(opacityValue, { duration: 200 })),
    };
  });

  return (
    <View style={styles.fabButtonContainer}>
      <AnimatedPressable 
        style={[animatedStyles, styles.fabButton]}
        onPress={onPress}
      >
        {icon}
      </AnimatedPressable>
      {visible && (
        <Animated.View style={[labelAnimatedStyle, styles.labelContainer]}>
          <Text style={styles.labelText}>{label}</Text>
        </Animated.View>
      )}
    </View>
  );
};

// Composant principal FAB
const ProjectsFab: React.FC<ProjectsFABProps> = ({ 
  filtersVisible = false,
  onAddPress,
  onEditPress,
  onOtherPress
}) => {
  const isExpanded = useSharedValue(false);
  const [expanded, setExpanded] = useState(false);
  const navigation = useNavigation();

  // Nettoyage à la destruction du composant
  useEffect(() => {
    const unsubscribe = () => {
      isExpanded.value = false;
      setExpanded(false);
    };
    return unsubscribe;
  }, []);

  // Fermer le FAB lors d'un changement de route/page
  useEffect(() => {
    const closeFab = () => {
      if (isExpanded.value || expanded) {
        isExpanded.value = false;
        setExpanded(false);
      }
    };

    // S'abonner aux événements de navigation
    const unsubscribe = navigation.addListener('beforeRemove', closeFab);
    const stateListener = navigation.addListener('state', closeFab);

    return () => {
      unsubscribe();
      stateListener();
    };
  }, [navigation, isExpanded, expanded]);

  // Fonction pour basculer l'état du FAB
  const toggleFAB = () => {
    isExpanded.value = !isExpanded.value;
    setExpanded(!expanded);
  };

  // Style animé pour l'icône principale
  const mainIconStyle = useAnimatedStyle(() => {
    const rotateValue = isExpanded.value ? '45deg' : '0deg';
    return {
      transform: [
        { rotate: withTiming(rotateValue, { duration: 300 }) },
      ],
    };
  });

  // Exécuter une action et fermer le FAB
  const handleAction = (callback: () => void) => {
    isExpanded.value = false;
    setExpanded(false);
    callback();
  };
  
  // Si les filtres sont visibles, on ne rend pas le FAB du tout
  if (filtersVisible) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      {/* Overlay pour fermer le FAB quand ouvert */}
      {expanded && (
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={toggleFAB}
        />
      )}

      {/* Bouton "Autres" */}
      <FABButton
        isExpanded={isExpanded}
        index={3}
        icon={<MaterialIcons name="more-horiz" size={24} color="#fff" />}
        label="Autres"
        onPress={() => handleAction(onOtherPress)}
        visible={expanded}
      />

      {/* Bouton "Éditer" */}
      <FABButton
        isExpanded={isExpanded}
        index={2}
        icon={<MaterialIcons name="edit" size={24} color="#fff" />}
        label="Éditer"
        onPress={() => handleAction(onEditPress)}
        visible={expanded}
      />

      {/* Bouton "Ajouter" */}
      <FABButton
        isExpanded={isExpanded}
        index={1}
        icon={<MaterialIcons name="add" size={24} color="#fff" />}
        label="Ajouter"
        onPress={() => handleAction(onAddPress)}
        visible={expanded}
      />

      {/* Bouton principal */}
      <Pressable 
        style={styles.mainButton}
        onPress={toggleFAB}
      >
        <Animated.View style={mainIconStyle}>
          <Ionicons name="add" size={30} color="#fff" />
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 90,
    alignItems: 'center',
    zIndex: 999,
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3F51B5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabButtonContainer: {
    position: 'absolute',
    alignItems: 'center',
    flexDirection: 'row',
  },
  fabButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#303F9F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  labelContainer: {
    position: 'absolute',
    right: 60,
    backgroundColor: '#1A237E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  labelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProjectsFab;
