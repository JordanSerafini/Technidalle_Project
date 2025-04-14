import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { project_status } from '../../utils/interfaces/project.interface';
import { useProjectStore } from '../../store/projectStore';

const statusLabels: Record<project_status, string> = {
  prospect: 'Prospect',
  devis_en_cours: 'Devis en cours',
  devis_accepte: 'Devis accepté',
  en_preparation: 'En préparation',
  en_cours: 'En cours',
  en_pause: 'En pause',
  termine: 'Terminé',
  annule: 'Annulé'
};

const statusColors: Record<project_status, string> = {
  prospect: '#FFC107',
  devis_en_cours: '#FF9800',
  devis_accepte: '#4CAF50',
  en_preparation: '#2196F3',
  en_cours: '#3F51B5',
  en_pause: '#9C27B0',
  termine: '#4CAF50',
  annule: '#F44336'
};

// Fonction utilitaire pour formater les dates
const formatDate = (date: Date | null): string => {
    if (!date) return 'Non défini';
    return date.toLocaleDateString('fr-FR');
};

// Composant de sélection de date personnalisé
const CustomDatePicker = ({ 
  visible, 
  setVisible, 
  onSelect, 
  currentDate 
}: { 
  visible: boolean; 
  setVisible: (visible: boolean) => void;
  onSelect: (date: Date) => void;
  currentDate: Date | null;
}) => {
  const [selectedYear, setSelectedYear] = useState(currentDate?.getFullYear() || new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate?.getMonth() || new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(currentDate?.getDate() || new Date().getDate());
  
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const days = Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1);
  
  const handleSelect = () => {
    const date = new Date(selectedYear, selectedMonth, selectedDay);
    onSelect(date);
    setVisible(false);
  };
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={() => setVisible(false)}
    >
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="w-4/5 bg-white rounded-lg p-4">
          <Text className="text-lg font-bold text-center mb-4">Sélectionner une date</Text>
          
          {/* Mois */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Mois</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedMonth(index)}
                    className={`mr-2 px-3 py-2 rounded-full ${
                      selectedMonth === index ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <Text className={selectedMonth === index ? 'text-white' : 'text-gray-700'}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          
          {/* Jours */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Jour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row flex-wrap">
                {days.map(day => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    className={`mr-2 mb-2 w-10 h-10 rounded-full items-center justify-center ${
                      selectedDay === day ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <Text className={selectedDay === day ? 'text-white' : 'text-gray-700'}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          
          {/* Années */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Année</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                {years.map(year => (
                  <TouchableOpacity
                    key={year}
                    onPress={() => setSelectedYear(year)}
                    className={`mr-2 px-3 py-2 rounded-full ${
                      selectedYear === year ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <Text className={selectedYear === year ? 'text-white' : 'text-gray-700'}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          
          {/* Boutons d'action */}
          <View className="flex-row justify-end mt-4">
            <TouchableOpacity
              onPress={() => setVisible(false)}
              className="mr-2 px-4 py-2 bg-gray-300 rounded-lg"
            >
              <Text>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSelect}
              className="px-4 py-2 bg-blue-500 rounded-lg"
            >
              <Text className="text-white">Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function ProjectFilter() {
    // Utiliser le store au lieu de l'état local
    const {
        filters,
        setSearchQuery,
        toggleStatus,
        setStartDate,
        setEndDate,
        resetFilters,
        applyFilters
    } = useProjectStore();
    
    const { searchQuery, selectedStatuses, startDate, endDate } = filters;
    
    // États locaux pour les sélecteurs de dates
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    // Gestionnaire pour le bouton Appliquer
    const handleApplyFilters = () => {
        // Appliquer les filtres
        applyFilters();
        // Le modal sera fermé automatiquement grâce au système d'événements dans projectStore
    };

    return (
        <ScrollView className='w-full bg-white p-4'>
            {/* Recherche */}
            <View className='mb-4'>
                <Text className='text-gray-700 font-medium mb-2'>Recherche</Text>
                <View className='flex-row items-center border border-gray-300 rounded-lg px-3 py-2 bg-gray-50'>
                    <Ionicons name="search" size={20} color="#666" />
                    <TextInput
                        className='flex-1 ml-2'
                        placeholder='Nom, référence, description...'
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* Statuts */}
            <View className='mb-4'>
                <Text className='text-gray-700 font-medium mb-2'>Statut</Text>
                <View className='flex-row flex-wrap'>
                    {Object.entries(statusLabels).map(([key, label]) => (
                        <TouchableOpacity
                            key={key}
                            onPress={() => toggleStatus(key as project_status)}
                            className={`mr-2 mb-2 px-3 py-1 rounded-full ${
                                selectedStatuses.includes(key as project_status)
                                    ? 'opacity-100'
                                    : 'opacity-60'
                            }`}
                            style={{
                                backgroundColor: selectedStatuses.includes(key as project_status)
                                    ? statusColors[key as project_status]
                                    : '#E0E0E0'
                            }}
                        >
                            <Text
                                className={`${
                                    selectedStatuses.includes(key as project_status)
                                        ? 'text-white'
                                        : 'text-gray-700'
                                } text-xs font-medium`}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Période */}
            <View className='mb-6'>
                <Text className='text-gray-700 font-medium mb-2'>Période</Text>
                
                <View className='mb-3'>
                    <View className='flex-row justify-between mb-1'>
                        <Text className='text-gray-600'>Date début</Text>
                        {startDate && (
                            <TouchableOpacity onPress={() => setStartDate(null)}>
                                <Text className='text-blue-500'>Effacer</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity 
                        onPress={() => setShowStartDatePicker(true)}
                        className='border border-gray-300 rounded-lg px-3 py-3 bg-gray-50 flex-row items-center'
                    >
                        <Ionicons name="calendar-outline" size={20} color="#666" />
                        <Text className='ml-2 text-gray-700'>{startDate ? formatDate(startDate) : 'Sélectionner une date'}</Text>
                    </TouchableOpacity>
                </View>
                
                <View>
                    <View className='flex-row justify-between mb-1'>
                        <Text className='text-gray-600'>Date fin</Text>
                        {endDate && (
                            <TouchableOpacity onPress={() => setEndDate(null)}>
                                <Text className='text-blue-500'>Effacer</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity 
                        onPress={() => setShowEndDatePicker(true)}
                        className='border border-gray-300 rounded-lg px-3 py-3 bg-gray-50 flex-row items-center'
                    >
                        <Ionicons name="calendar-outline" size={20} color="#666" />
                        <Text className='ml-2 text-gray-700'>{endDate ? formatDate(endDate) : 'Sélectionner une date'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Custom Date Pickers */}
                <CustomDatePicker
                  visible={showStartDatePicker}
                  setVisible={setShowStartDatePicker}
                  onSelect={setStartDate}
                  currentDate={startDate}
                />
                
                <CustomDatePicker
                  visible={showEndDatePicker}
                  setVisible={setShowEndDatePicker}
                  onSelect={setEndDate}
                  currentDate={endDate}
                />
            </View>

            {/* Boutons d'action */}
            <View className='flex-row justify-between mt-2'>
                <TouchableOpacity 
                    onPress={resetFilters}
                    className='flex-1 mr-2 py-3 bg-gray-200 rounded-lg items-center'
                >
                    <Text className='text-gray-700 font-medium'>Réinitialiser</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={handleApplyFilters}
                    className='flex-1 ml-2 py-3 bg-blue-600 rounded-lg items-center'
                >
                    <Text className='text-white font-medium'>Appliquer</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

