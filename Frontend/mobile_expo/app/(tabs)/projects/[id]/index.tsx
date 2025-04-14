import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useFetch } from '../../../hooks/useFetch';
import { Project, project_status } from '../../../utils/interfaces/project.interface';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: project, loading, error } = useFetch<Project>(`projects/${id}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
    }
  });

  if (loading) {
    return (
      <View className="flex items-center justify-center h-full">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="text-gray-600 mt-4">Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex items-center justify-center h-full">
        <Text className="text-red-500">Erreur: {error}</Text>
        <TouchableOpacity 
          className="mt-4 bg-blue-500 py-2 px-4 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white">Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!project) {
    return (
      <View className="flex items-center justify-center h-full">
        <Text className="text-gray-600">Projet non trouvé</Text>
        <TouchableOpacity 
          className="mt-4 bg-blue-500 py-2 px-4 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white">Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView>
        {/* Header avec bouton retour */}
        <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-xl font-bold flex-1">{project.name}</Text>
        </View>

        {/* Informations principales */}
        <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
          <Text className="text-lg font-bold mb-2">Informations générales</Text>
          
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Référence:</Text>
            <Text className="font-medium">{project.reference}</Text>
          </View>
          
          {project.status && (
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600">Statut:</Text>
              <View style={{backgroundColor: statusColors[project.status]}} className="py-1 px-3 rounded-full">
                <Text className="text-white font-medium">{statusLabels[project.status]}</Text>
              </View>
            </View>
          )}
          
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Date de début:</Text>
            <Text>{project.start_date ? new Date(project.start_date).toLocaleDateString('fr-FR') : 'Non définie'}</Text>
          </View>
          
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Date de fin:</Text>
            <Text>{project.end_date ? new Date(project.end_date).toLocaleDateString('fr-FR') : 'Non définie'}</Text>
          </View>
          
          {project.budget && (
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600">Budget:</Text>
              <Text className="font-medium">{project.budget.toLocaleString('fr-FR')} €</Text>
            </View>
          )}
          
          {project.description && (
            <View className="mt-2">
              <Text className="text-gray-600 mb-1">Description:</Text>
              <Text className="text-gray-800">{project.description}</Text>
            </View>
          )}
        </View>

        {/* Informations du client */}
        {project.clients && (
          <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
            <Text className="text-lg font-bold mb-2">Client</Text>
            
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600">Nom:</Text>
              <Text className="font-medium">{project.clients.firstname} {project.clients.lastname}</Text>
            </View>
            
            {project.clients.company_name && (
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-600">Société:</Text>
                <Text>{project.clients.company_name}</Text>
              </View>
            )}
            
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600">Email:</Text>
              <Text>{project.clients.email}</Text>
            </View>
            
            {(project.clients.phone || project.clients.mobile) && (
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-600">Téléphone:</Text>
                <Text>{project.clients.mobile || project.clients.phone}</Text>
              </View>
            )}
          </View>
        )}

        {/* Adresse */}
        {project.addresses && (
          <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
            <Text className="text-lg font-bold mb-2">Adresse du chantier</Text>
            
            <Text className="text-gray-800">
              {project.addresses.street_number && `${project.addresses.street_number} `}
              {project.addresses.street_name}
            </Text>
            
            {project.addresses.additional_address && (
              <Text className="text-gray-800">{project.addresses.additional_address}</Text>
            )}
            
            <Text className="text-gray-800">
              {project.addresses.zip_code} {project.addresses.city}
            </Text>
            
            {project.addresses.country && (
              <Text className="text-gray-800">{project.addresses.country}</Text>
            )}
          </View>
        )}

        {/* Étapes du projet */}
        <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
          <Text className="text-lg font-bold mb-2">Étapes du projet</Text>
          
          {project.project_stages && project.project_stages.length > 0 ? (
            project.project_stages.map((stage, index) => (
              <View key={stage.id} className="border-l-4 border-blue-500 pl-3 mb-3 py-2">
                <View className="flex-row justify-between">
                  <Text className="font-bold">{stage.name}</Text>
                  {stage.completion_percentage !== undefined && (
                    <Text>{stage.completion_percentage}%</Text>
                  )}
                </View>
                
                {stage.description && (
                  <Text className="text-gray-600 mt-1">{stage.description}</Text>
                )}
                
                <View className="flex-row mt-2">
                  <Text className="text-gray-600 text-sm">
                    {stage.start_date ? new Date(stage.start_date).toLocaleDateString('fr-FR') : 'Non défini'} 
                    {stage.end_date ? ` - ${new Date(stage.end_date).toLocaleDateString('fr-FR')}` : ''}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">Aucune étape définie pour ce projet</Text>
          )}
        </View>

        {/* Tags du projet */}
        {project.project_tags && project.project_tags.length > 0 && (
          <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
            <Text className="text-lg font-bold mb-2">Tags</Text>
            
            <View className="flex-row flex-wrap">
              {project.project_tags.map((tagRel) => (
                tagRel.tags && (
                  <View 
                    key={tagRel.tag_id} 
                    style={{backgroundColor: tagRel.tags.color || '#e0e0e0'}}
                    className="mr-2 mb-2 py-1 px-3 rounded-full"
                  >
                    <Text className="text-white">{tagRel.tags.name}</Text>
                  </View>
                )
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {project.notes && (
          <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
            <Text className="text-lg font-bold mb-2">Notes</Text>
            <Text className="text-gray-800">{project.notes}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
