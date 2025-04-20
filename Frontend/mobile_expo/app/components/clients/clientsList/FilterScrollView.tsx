import React, { useCallback, useMemo } from 'react';
import { Animated } from 'react-native';
import FilterOption from './FilterOption';

interface FilterScrollViewProps {
  options: string[];
  selectedOption: string | null;
  onSelect: (option: string | null) => void;
  allLabel?: string;
}

const FilterScrollView = React.memo(({ 
  options, 
  selectedOption, 
  onSelect, 
  allLabel = "Tous" 
}: FilterScrollViewProps) => {
  const handleAllSelect = useCallback(() => {
    onSelect(null);
  }, [onSelect]);
  
  // Générer les gestionnaires d'événements une seule fois
  const optionHandlers = useMemo(() => {
    return options.map(option => () => onSelect(option));
  }, [options, onSelect]);
  
  return (
    <Animated.ScrollView 
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      style={{ maxHeight: 75 }}
      contentContainerStyle={{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', paddingHorizontal: 8 }}
    >
      {/* Option "Tous" */}
      <FilterOption 
        label={allLabel} 
        isSelected={selectedOption === null} 
        onPress={handleAllSelect} 
      />
      
      {/* Options spécifiques */}
      {options.map((option, index) => (
        <FilterOption 
          key={option}
          label={option} 
          isSelected={selectedOption === option} 
          onPress={optionHandlers[index]} 
        />
      ))}
    </Animated.ScrollView>
  );
}, (prevProps, nextProps) => {
  // Seulement re-rendre si les options changent ou la sélection change
  return prevProps.selectedOption === nextProps.selectedOption && 
         prevProps.options.length === nextProps.options.length;
});

export default FilterScrollView; 