import React, { useCallback } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface SearchBarProps {
  searchInput: string;
  onSearchChange: (text: string) => void;
  onFilterToggle: () => void;
  hasFilters: boolean;
}

const SearchBar = React.memo(({ 
  searchInput, 
  onSearchChange, 
  onFilterToggle,
  hasFilters 
}: SearchBarProps) => {
  // Fonction pour effacer la recherche
  const clearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <View className="flex-row items-center px-4 py-3 border-t border-gray-200 bg-white">
      <View className="flex-1 flex-row bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 items-center">
        <Ionicons name="search" size={20} color="#6b7280" />
        <TextInput
          className="flex-1 ml-2 text-gray-800"
          placeholder="Rechercher un client..."
          value={searchInput}
          onChangeText={onSearchChange}
          returnKeyType="search"
        />
        {searchInput.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity 
        className="ml-2 bg-blue-50 p-2 rounded-lg border border-blue-200"
        onPress={onFilterToggle}
      >
        <MaterialIcons 
          name="filter-list" 
          size={24} 
          color={hasFilters ? "#1e40af" : "#6b7280"} 
        />
      </TouchableOpacity>
    </View>
  );
});

export default SearchBar; 