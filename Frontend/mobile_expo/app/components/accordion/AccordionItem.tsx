import React, { useEffect } from 'react';
import { View, Animated } from 'react-native';

// Interface pour les props de AccordionItem
interface AccordionItemProps {
  isExpanded: boolean;
  children: React.ReactNode;
  maxHeight?: number;
}

// Composant AccordionItem pour l'animation
export function AccordionItem({ isExpanded, children, maxHeight = 1000 }: AccordionItemProps) {
  const [height] = React.useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(height, {
      toValue: isExpanded ? maxHeight : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, maxHeight, height]);

  // Si l'accordéon est déplié, on n'applique pas de hauteur fixe
  if (isExpanded) {
    return (
      <View style={{ height: 'auto' }}>
        {children}
      </View>
    );
  }

  // Si l'accordéon est fermé, on utilise l'animation
  return (
    <Animated.View style={{ height, overflow: 'hidden' }}>
      {children}
    </Animated.View>
  );
}

export default AccordionItem; 