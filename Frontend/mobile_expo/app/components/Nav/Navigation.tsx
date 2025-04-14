import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigationStore } from '../../store/navigationStore';
import { Searchbar } from './Searchbar';

export function Navigation() {
  const { currentPage, setCurrentPage } = useNavigationStore();

  return (
    <View className="absolute bottom-0 left-0 right-0">
      {/* Search */}
      <View className="w-full px-2 py-2 bg-gray-900">
        <Searchbar />
      </View>
      {/* Navigation */}
      <View className="flex-row justify-between items-center w-full bg-gray-800 h-16 px-4">
        <TouchableOpacity onPress={() => setCurrentPage('dashboard')}>
          <Text 
            className={`font-medium ${currentPage === 'dashboard' ? 'text-blue-400' : 'text-white'}`} 
          >
            Dashboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentPage('planning')}>
          <Text 
            className={`font-medium ${currentPage === 'planning' ? 'text-blue-400' : 'text-white'}`} 
          >
            Planning
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentPage('clients')}>
          <Text 
            className={`font-medium ${currentPage === 'clients' ? 'text-blue-400' : 'text-white'}`} 
          >
            Clients
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentPage('projets')}>
          <Text 
            className={`font-medium ${currentPage === 'projets' ? 'text-blue-400' : 'text-white'}`} 
          >
            Projets
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentPage('documents')}>
          <Text 
            className={`font-medium ${currentPage === 'documents' ? 'text-blue-400' : 'text-white'}`} 
          >
            Documents
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default Navigation; 