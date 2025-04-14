import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFetch } from '../../../hooks/useFetch';
import { Document } from '@/app/utils/interfaces/document';

interface ProjectDocumentsProps {
  projectId: string | number;
  isOpen: boolean;
  onToggle: () => void;
  onDocumentPress: (document: Document) => void;
}

export const ProjectDocuments: React.FC<ProjectDocumentsProps> = ({
  projectId,
  isOpen,
  onToggle,
  onDocumentPress
}) => {
  // Assurez-vous que le projectId est bien converti en nombre
  const endpoint = `documents/project/${Number(projectId)}`;
  const { data: documents, loading, error } = useFetch<Document[]>(endpoint);
  console.log(`Documents pour le projet ${projectId}:`, documents);

  // Fonction pour obtenir l'icône selon le type de document
  const getDocumentIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'devis': 
        return <MaterialIcons name="request-quote" size={20} color="#2563eb" />;
      case 'facture': 
        return <MaterialIcons name="receipt" size={20} color="#2563eb" />;
      case 'contrat': 
        return <MaterialIcons name="assignment" size={20} color="#2563eb" />;
      case 'plan': 
        return <MaterialIcons name="architecture" size={20} color="#2563eb" />;
      case 'photo_chantier': 
        return <MaterialIcons name="photo" size={20} color="#2563eb" />;
      case 'bon_de_commande': 
        return <MaterialIcons name="shopping-cart" size={20} color="#2563eb" />;
      case 'bon_de_livraison': 
        return <MaterialIcons name="local-shipping" size={20} color="#2563eb" />;
      case 'fiche_technique': 
        return <MaterialIcons name="description" size={20} color="#2563eb" />;
      default: 
        return <MaterialIcons name="insert-drive-file" size={20} color="#2563eb" />;
    }
  };

  // Fonction pour formater le statut du document
  const getStatusLabel = (status: string | null) => {
    if (!status) return null;
    
    switch(status.toLowerCase()) {
      case 'brouillon': return { label: 'Brouillon', color: 'bg-gray-500' };
      case 'en_attente': return { label: 'En attente', color: 'bg-orange-500' };
      case 'valide': return { label: 'Validé', color: 'bg-green-500' };
      case 'refuse': return { label: 'Refusé', color: 'bg-red-500' };
      case 'annule': return { label: 'Annulé', color: 'bg-red-600' };
      default: return { label: status, color: 'bg-gray-400' };
    }
  };

  return (
    <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
      <TouchableOpacity 
        className="flex-row justify-between items-center"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="description" size={22} color="#1e40af" className="mr-2" />
          <Text className="text-lg font-bold ml-2">Documents</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View className="mt-4">
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : error ? (
            <Text className="text-red-500">Erreur lors du chargement des documents</Text>
          ) : documents && documents.length > 0 ? (
            documents.map((document) => {
              const statusInfo = document.status ? getStatusLabel(document.status as string) : null;
              
              return (
                <TouchableOpacity 
                  key={document.id} 
                  className="flex-row items-center justify-between py-3 border-b border-gray-100"
                  onPress={() => onDocumentPress(document)}
                >
                  <View className="flex-row items-center flex-1">
                    {getDocumentIcon(document.type as string)}
                    <View className="ml-3 flex-1">
                      <Text className="font-medium">{document.reference}</Text>
                      <View className="flex-row items-center">
                        <Text className="text-gray-500 text-sm">{document.type}</Text>
                        {document.amount && (
                          <Text className="text-blue-600 text-sm ml-2">
                            {document.amount.toLocaleString('fr-FR')}€
                          </Text>
                        )}
                      </View>
                      <Text className="text-gray-400 text-xs">
                        {new Date(document.issue_date).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center">
                    {statusInfo && (
                      <View className={`px-2 py-1 rounded-full mr-2 ${statusInfo.color}`}>
                        <Text className="text-white text-xs font-medium">{statusInfo.label}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text className="text-gray-500">Aucun document associé à ce projet</Text>
          )}
        </View>
      )}
    </View>
  );
}; 