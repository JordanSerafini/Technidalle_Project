import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
    const [showStartDatePicker, setShowStartDatePicker] = React.useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = React.useState(false);

    const formatDate = (date: Date | null) => {
        if (!date) return 'Non défini';
        return date.toLocaleDateString('fr-FR');
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
                
                <View className='flex-row justify-between mb-2'>
                    <TouchableOpacity 
                        onPress={() => setShowStartDatePicker(true)}
                        className='flex-1 mr-2 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 flex-row items-center'
                    >
                        <Ionicons name="calendar-outline" size={20} color="#666" />
                        <Text className='ml-2 text-gray-700'>{startDate ? formatDate(startDate) : 'Date début'}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={() => setShowEndDatePicker(true)}
                        className='flex-1 ml-2 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 flex-row items-center'
                    >
                        <Ionicons name="calendar-outline" size={20} color="#666" />
                        <Text className='ml-2 text-gray-700'>{endDate ? formatDate(endDate) : 'Date fin'}</Text>
                    </TouchableOpacity>
                </View>

                {showStartDatePicker && (
                    <DateTimePicker
                        value={startDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                            setShowStartDatePicker(false);
                            if (selectedDate) {
                                setStartDate(selectedDate);
                            }
                        }}
                    />
                )}

                {showEndDatePicker && (
                    <DateTimePicker
                        value={endDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                            setShowEndDatePicker(false);
                            if (selectedDate) {
                                setEndDate(selectedDate);
                            }
                        }}
                    />
                )}
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
                    onPress={applyFilters}
                    className='flex-1 ml-2 py-3 bg-blue-600 rounded-lg items-center'
                >
                    <Text className='text-white font-medium'>Appliquer</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

