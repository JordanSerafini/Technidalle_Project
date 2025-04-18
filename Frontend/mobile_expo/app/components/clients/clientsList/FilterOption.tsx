import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

interface FilterOptionProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const FilterOption = React.memo(({ 
  label, 
  isSelected, 
  onPress 
}: FilterOptionProps) => {
  // Styles précalculés pour éviter les calculs à chaque rendu
  const containerStyle = {
    backgroundColor: isSelected ? '#3b82f6' : '#f3f4f6',
    borderColor: isSelected ? '#2563eb' : '#e5e7eb'
  };
  
  const textStyle = {
    color: isSelected ? '#ffffff' : '#1f2937'
  };
  
  return (
    <TouchableOpacity 
      className="mx-1 px-3 py-1 rounded-full border"
      style={containerStyle}
      onPress={onPress}
    >
      <Text style={textStyle}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return prevProps.label === nextProps.label && 
         prevProps.isSelected === nextProps.isSelected;
});

export default FilterOption; 