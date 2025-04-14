import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import { useSearchStore } from '../store/searchStore';
import { useFetch } from '../hooks/useFetch';
import Client, { Address } from '../utils/interfaces/client.interface';
import Project, { Stage } from '../utils/interfaces/project.interface';
import Material from '../utils/interfaces/material.interface';


// Interface pour la réponse API qui utilise les interfaces existantes
interface SearchResponse {
  clients: Client[];
  projects: Project[];
  materials: Material[];
}

// Fonction pour formater les statuts des projets
const formatProjectStatus = (status: string): { text: string; color: string } => {
  switch (status) {
    case 'en_cours':
      return { text: 'En cours', color: 'bg-blue-900 text-blue-300' };
    case 'termine':
      return { text: 'Terminé', color: 'bg-green-900 text-green-300' };
    case 'en_preparation':
      return { text: 'En préparation', color: 'bg-yellow-900 text-yellow-300' };
    case 'devis_accepte':
      return { text: 'Devis accepté', color: 'bg-purple-900 text-purple-300' };
    default:
      return { text: status, color: 'bg-gray-900 text-gray-300' };
  }
};

// Fonction pour formater les dates
const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('fr-FR');
};

 function SearchResults() {
  const { setCurrentPage } = useNavigationStore();
  const { searchQuery } = useSearchStore();
  
  // Utilisation du hook useFetch pour récupérer les résultats de recherche
  const { data, loading, error } = useFetch<SearchResponse>('search', {
    searchQuery: searchQuery,
    limit: 20
  });
  
  // Fonction pour revenir à la page précédente
  const goBack = () => {
    setCurrentPage('dashboard');
  };

  // Fonction pour naviguer vers la page d'un client
  const viewClient = (clientId: number) => {
    // TODO: implémenter la navigation vers le détail du client
    console.log("Voir client:", clientId);
  };

  // Fonction pour naviguer vers la page d'un projet
  const viewProject = (projectId: number) => {
    // TODO: implémenter la navigation vers le détail du projet
    console.log("Voir projet:", projectId);
  };

  // Fonction pour naviguer vers la page d'un matériel
  const viewMaterial = (materialId: number) => {
    // TODO: implémenter la navigation vers le détail du matériel
    console.log("Voir matériel:", materialId);
  };

  // Fonction pour calculer le nombre total de résultats
  const getTotalResults = () => {
    if (!data) return 0;
    return (data.clients?.length || 0) + (data.projects?.length || 0) + (data.materials?.length || 0);
  };

  return (
    <View className="flex-1 bg-gray-900">
      {/* Header avec titre et bouton retour */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={goBack}>
            <Text className="text-blue-400 text-lg mr-2">←</Text>
          </TouchableOpacity>
          <Text className="text-white font-bold text-lg">Résultats</Text>
        </View>
        <Text className="text-gray-400">"{searchQuery || ''}"</Text>
      </View>
      
      {/* Contenu des résultats */}
      <ScrollView className="flex-1 p-4">
        {loading ? (
          <View className="items-center justify-center py-4">
            <ActivityIndicator size="large" color="#60a5fa" />
            <Text className="text-white mt-2">Chargement en cours...</Text>
          </View>
        ) : error ? (
          <View className="p-4 bg-red-900 bg-opacity-30 rounded-md">
            <Text className="text-red-300">Erreur: {error}</Text>
          </View>
        ) : !data || getTotalResults() === 0 ? (
          <View className="p-4 bg-gray-800 rounded-md">
            <Text className="text-gray-300">
              Aucun résultat trouvé pour "{searchQuery}".
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            <Text className="text-white">
              {getTotalResults()} résultat(s) pour: {searchQuery}
            </Text>
            
            {/* Résultats des clients */}
            {data.clients && data.clients.length > 0 && (
              <View className="space-y-2">
                <Text className="text-white font-bold text-lg">Clients ({data.clients.length})</Text>
                {data.clients.map((client: Client) => (
                  <TouchableOpacity 
                    key={client.id} 
                    className="p-3 bg-gray-800 rounded-md" 
                    onPress={() => client.id && viewClient(client.id)}
                  >
                    <Text className="text-white font-bold">
                      {client.firstname} {client.lastname}
                      {client.company_name !== 'Particulier' && ` - ${client.company_name}`}
                    </Text>
                    <Text className="text-gray-300 mt-1">{client.email}</Text>
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-gray-400 text-sm">{client.phone}</Text>
                      {client.mobile && (
                        <Text className="text-gray-400 text-sm">{client.mobile}</Text>
                      )}
                    </View>
                    {client.addresses && (
                      <Text className="text-gray-400 text-xs mt-1">
                        {client.addresses.street_number} {client.addresses.street_name}, {client.addresses.zip_code} {client.addresses.city}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Résultats des projets */}
            {data.projects && data.projects.length > 0 && (
              <View className="space-y-2">
                <Text className="text-white font-bold text-lg">Projets ({data.projects.length})</Text>
                {data.projects.map((project: Project) => {
                  return (
                    <TouchableOpacity 
                      key={project.id} 
                      className="p-3 bg-gray-800 rounded-md" 
                      onPress={() => viewProject(project.id)}
                    >
                      <Text className="text-white font-bold">{project.name}</Text>
                      <Text className="text-gray-300 mt-1 text-sm">{project.description}</Text>
                      <View className="flex-row justify-between mt-2">

                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
       
            
            {/* Résultats des matériaux */}
            {data.materials && data.materials.length > 0 && (
              <View className="space-y-2">
                <Text className="text-white font-bold text-lg">Matériaux ({data.materials.length})</Text>
                {data.materials.map((material: Material) => {
                  // Adapter Material pour accéder à quantity qui pourrait être stock_quantity
                  const apiMaterial = material as Material & { quantity?: number };
                  return (
                    <TouchableOpacity 
                      key={material.id} 
                      className="p-3 bg-gray-800 rounded-md" 
                      onPress={() => viewMaterial(material.id)}
                    >
                      <Text className="text-white font-bold">{material.name}</Text>
                      <Text className="text-gray-300 mt-1">{material.description}</Text>
                      <View className="flex-row justify-between mt-2">
                        <Text className="text-gray-400 text-sm">Quantité: {apiMaterial.quantity || material.stock_quantity || 0}</Text>
                        {material.price !== undefined && (
                          <Text className="text-green-400 text-sm">{material.price.toLocaleString('fr-FR')}€</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
        
        <View className="mt-4 mb-8">
          <TouchableOpacity 
            className="p-3 bg-blue-900 bg-opacity-30 rounded-md items-center"
            onPress={goBack}
          >
            <Text className="text-blue-400">Retour au dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

export default SearchResults; 