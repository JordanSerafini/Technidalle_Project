import React, { useState, useEffect } from 'react';
import { View, Animated } from 'react-native';
import { AccordionItemProps } from '../utils/types/accordion.types';

const AccordionItem: React.FC<AccordionItemProps> = ({ 
  isExpanded, 
  children, 
  maxHeight = 1000 
}) => {
  const [height] = useState(new Animated.Value(0));

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
};

export default AccordionItem; 