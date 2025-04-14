import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { project_status } from '../../../utils/interfaces/project.interface';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

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

interface ProjectInfoProps {
  reference: string;
  name?: string;
  status?: project_status;
  start_date?: string;
  end_date?: string;
  budget?: number;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const ProjectInfo: React.FC<ProjectInfoProps> = ({
  reference,
  name,
  status,
  start_date,
  end_date,
  budget,
  description,
  isOpen,
  onToggle
}) => {
  return (
    <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
      <TouchableOpacity 
        className="flex-row justify-between items-center"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="info" size={22} color="#1e40af" className="mr-2" />
          <Text className="text-lg font-bold ml-2">Informations générales</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View className="mt-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Nom du projet:</Text>
            <Text className="text-xs">{name}</Text>
            </View>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Référence:</Text>
            <Text className="font-medium">{reference}</Text>
          </View>
          
          {status && (
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600">Statut:</Text>
              <View style={{backgroundColor: statusColors[status]}} className="py-1 px-3 rounded-full">
                <Text className="text-white font-medium">{statusLabels[status]}</Text>
              </View>
            </View>
          )}
          
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Date de début:</Text>
            <Text>{start_date ? new Date(start_date).toLocaleDateString('fr-FR') : 'Non définie'}</Text>
          </View>
          
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Date de fin:</Text>
            <Text>{end_date ? new Date(end_date).toLocaleDateString('fr-FR') : 'Non définie'}</Text>
          </View>
          
          {budget && (
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600">Budget:</Text>
              <Text className="font-medium">{budget.toLocaleString('fr-FR')} €</Text>
            </View>
          )}
          
          {description && (
            <View className="mt-2">
              <Text className="text-gray-600 mb-1">Description:</Text>
              <Text className="text-gray-800">{description}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}; 