import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Document } from '@/app/utils/types/document';

interface ClientDocumentsProps {
  documents?: Document[];
  isLoading: boolean;
  error?: any;
  isOpen: boolean;
  onToggle: () => void;
  onDocumentPress: (filePath?: string) => void;
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
    <View className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full items-center tracking-widest">
      <TouchableOpacity 
        className="flex-row justify-between items-center w-full mb-4"
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="folder" size={24} color="#1e40af" />
          <Text className="text-lg font-semibold text-blue-900 ml-2">Documents</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#2563eb" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <>
          {isLoading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : error ? (
            <Text className="text-red-500">Erreur lors du chargement des documents</Text>
          ) : documents && documents.length > 0 ? (
            <>
              {documents.map((doc, index) => (
                <TouchableOpacity 
                  key={index}
                  className="flex-row items-center mb-3 w-full"
                  onPress={() => onDocumentPress(doc.file_path || undefined)}
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
                  <MaterialIcons name="file-download" size={24} color="#2563eb" />
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <View className="flex-row items-center">
              <MaterialIcons name="info-outline" size={20} color="#64748b" />
              <Text className="text-gray-500 ml-2">Aucun document disponible</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}; 