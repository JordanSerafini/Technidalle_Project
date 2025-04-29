import React, { useState, useEffect } from 'react';
import { Animated, View } from 'react-native';

interface AccordionItemProps {
  isExpanded: boolean;
  children: React.ReactNode;
  maxHeight?: number;
}

export default function AccordionItem({ isExpanded, children, maxHeight = 1000 }: AccordionItemProps) {
  const [height] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(height, {
      toValue: isExpanded ? maxHeight : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, maxHeight]);

  if (isExpanded) {
    return (
      <View style={{ height: 'auto' }}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View style={{ height, overflow: 'hidden' }}>
      {children}
    </Animated.View>
  );
}