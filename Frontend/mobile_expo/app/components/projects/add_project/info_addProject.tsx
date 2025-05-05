import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Fonction de formatage de date
const formatDate = (date: Date) => {
  return date.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
};

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'Prospect', value: 'prospect' },
  { label: 'Devis en cours', value: 'devis_en_cours' },
  { label: 'Devis accepté', value: 'devis_accepte' },
  { label: 'En préparation', value: 'en_preparation' },
  { label: 'En cours', value: 'en_cours' },
  { label: 'En pause', value: 'en_pause' },
  { label: 'Terminé', value: 'termine' },
  { label: 'Annulé', value: 'annule' }
];

interface InfoAddProjectProps {
  projectName: string;
  setProjectName: React.Dispatch<React.SetStateAction<string>>;
  projectReference: string;
  setProjectReference: React.Dispatch<React.SetStateAction<string>>;
  projectDescription: string;
  setProjectDescription: React.Dispatch<React.SetStateAction<string>>;
  status: string;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  startDate: Date | null;
  setStartDate: React.Dispatch<React.SetStateAction<Date | null>>;
  endDate: Date | null;
  setEndDate: React.Dispatch<React.SetStateAction<Date | null>>;
  budget: string;
  setBudget: React.Dispatch<React.SetStateAction<string>>;
  priority: string;
  setPriority: React.Dispatch<React.SetStateAction<string>>;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
}

const InfoAddProject: React.FC<InfoAddProjectProps> = ({
  projectName, setProjectName,
  projectReference, setProjectReference,
  projectDescription, setProjectDescription,
  status, setStatus,
  startDate, setStartDate,
  endDate, setEndDate,
  budget, setBudget,
  priority, setPriority,
  notes, setNotes
}) => {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Gestion des dates
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };
  
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  return (
    <>
      {/* Informations de base */}
      <Text className="text-base font-bold mt-3 mb-2 text-indigo-700">Informations de base</Text>
      
      <Text className="text-sm mb-1 text-gray-600">Nom du projet *</Text>
      <TextInput
        className="h-10 border border-gray-300 rounded-md mb-4 px-3 bg-gray-50"
        placeholder="Nom du projet"
        value={projectName}
        onChangeText={setProjectName}
      />
      
      <Text className="text-sm mb-1 text-gray-600">Référence</Text>
      <TextInput
        className="h-10 border border-gray-300 rounded-md mb-4 px-3 bg-gray-50"
        placeholder="Référence (optionnelle, générée automatiquement si vide)"
        value={projectReference}
        onChangeText={setProjectReference}
      />
      
      <Text className="text-sm mb-1 text-gray-600">Description</Text>
      <TextInput
        className="h-20 border border-gray-300 rounded-md mb-4 px-3 pt-2 bg-gray-50"
        placeholder="Description du projet"
        value={projectDescription}
        onChangeText={setProjectDescription}
        multiline={true}
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Informations complémentaires */}
      <Text className="text-base font-bold mt-3 mb-2 text-indigo-700">Informations complémentaires</Text>
      
      <Text className="text-sm mb-1 text-gray-600">Statut</Text>
      <TouchableOpacity 
        className="flex-row justify-between items-center h-10 border border-gray-300 rounded-md mb-4 px-3 bg-gray-50"
        onPress={() => setShowStatusPicker(true)}
      >
        <Text>{STATUS_OPTIONS.find(opt => opt.value === status)?.label || 'Prospect'}</Text>
        <Ionicons name="chevron-down" size={20} color="#888" />
      </TouchableOpacity>
      
      <View className="flex-row justify-between mb-2">
        <View className="w-[48%]">
          <Text className="text-sm mb-1 text-gray-600">Date début</Text>
          <TouchableOpacity 
            className="flex-row justify-between items-center h-10 border border-gray-300 rounded-md mb-4 px-3 bg-gray-50"
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text>{startDate ? formatDate(startDate) : 'Sélectionner'}</Text>
            <Ionicons name="calendar-outline" size={20} color="#888" />
          </TouchableOpacity>
        </View>
        
        <View className="w-[48%]">
          <Text className="text-sm mb-1 text-gray-600">Date fin prévue</Text>
          <TouchableOpacity 
            className="flex-row justify-between items-center h-10 border border-gray-300 rounded-md mb-4 px-3 bg-gray-50"
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text>{endDate ? formatDate(endDate) : 'Sélectionner'}</Text>
            <Ionicons name="calendar-outline" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text className="text-sm mb-1 text-gray-600">Budget</Text>
      <TextInput
        className="h-10 border border-gray-300 rounded-md mb-4 px-3 bg-gray-50"
        placeholder="Budget (€)"
        value={budget}
        onChangeText={setBudget}
        keyboardType="numeric"
      />
      
      <Text className="text-sm mb-1 text-gray-600">Priorité (1-5)</Text>
      <TextInput
        className="h-10 border border-gray-300 rounded-md mb-4 px-3 bg-gray-50"
        placeholder="Priorité (1 à 5)"
        value={priority}
        onChangeText={setPriority}
        keyboardType="numeric"
        maxLength={1}
      />
      
      <Text className="text-sm mb-1 text-gray-600">Notes</Text>
      <TextInput
        className="h-20 border border-gray-300 rounded-md mb-4 px-3 pt-2 bg-gray-50"
        placeholder="Notes additionnelles"
        value={notes}
        onChangeText={setNotes}
        multiline={true}
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Pickers de date */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}
      
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
        />
      )}
      
      {/* Modal pour le statut */}
      <Modal
        visible={showStatusPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5">
            <Text className="text-lg font-bold mb-4 text-center">Sélectionner un statut</Text>
            
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`py-4 border-b border-gray-200 ${status === option.value ? 'bg-indigo-50' : ''}`}
                onPress={() => {
                  setStatus(option.value);
                  setShowStatusPicker(false);
                }}
              >
                <Text
                  className={`text-base ${status === option.value ? 'text-indigo-700 font-bold' : ''}`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              className="mt-4 p-4 bg-gray-200 rounded-md items-center"
              onPress={() => setShowStatusPicker(false)}
            >
              <Text className="text-base font-medium">Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default InfoAddProject;
