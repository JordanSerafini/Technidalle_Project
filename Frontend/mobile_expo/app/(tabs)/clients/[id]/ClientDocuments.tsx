import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Document } from '@/app/utils/interfaces/document';

interface ClientDocumentsProps {
  documents?: Document[];
  isLoading: boolean;
  error?: any;
  isOpen: boolean;
  onToggle: () => void;
  onDocumentPress: (documentId: number) => void;
}

export const ClientDocuments: React.FC<ClientDocumentsProps> = ({
  documents,
  isLoading,
  error,
  isOpen,
  onToggle,
  onDocumentPress
}) => {
  return (
    <View className="bg-white rounded-lg shadow-sm w-full mb-4">
      <TouchableOpacity 
        className="p-3 flex-row justify-between items-center w-full"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <View className="w-8 h-8 flex items-center justify-center">
            <MaterialIcons name="folder" size={24} color="#1e40af" />
          </View>
          <View className="flex-row items-center ">
            <Text className="text-lg font-semibold text-blue-900 ml-3">Documents</Text>
            <Text className="text-blue-800 px-2 py-0 rounded-full ml-1">{documents?.length}</Text>
          </View>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View className="px-4 pb-4 w-full">
          {isLoading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : error ? (
            <Text className="text-red-500">Erreur lors du chargement des documents</Text>
          ) : documents && documents.length > 0 ? (
            <View className="w-full ">
              {documents.map((doc, index) => (
                <TouchableOpacity 
                  key={index}
                  className="flex-row items-center w-full mb-2.5"
                  onPress={() => onDocumentPress(doc.id)}
                >
                  <MaterialCommunityIcons 
                    name={
                      doc.type === 'facture' 
                        ? "file-document-outline" 
                        : doc.type === 'devis' 
                          ? "file-chart-outline" 
                          : "file-document-outline"
                    } 
                    size={24} 
                    color="#2563eb" 
                  />
                  <Text className="ml-3 text-blue-700 flex-1">{doc.reference}</Text>
                  <Text className="text-gray-500 text-sm mr-2">{doc.type}</Text>
                  <MaterialIcons name="chevron-right" size={24} color="#2563eb" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="flex-row items-center">
              <MaterialIcons name="info-outline" size={20} color="#64748b" />
              <Text className="text-gray-500 ml-2">Aucun document disponible</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}; 

export default ClientDocuments;