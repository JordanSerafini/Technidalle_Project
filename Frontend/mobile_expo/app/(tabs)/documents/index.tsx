import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView, TextInput } from "react-native";
import { useRouter, Stack, Link } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFetch } from '@/app/hooks/useFetch';
import { Document, DocumentType } from '@/app/utils/interfaces/document';
import { formatDate } from '@/app/utils/dateFormatter';

export default function DocumentsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  
  // Récupération des documents
  const { data: documents, loading, error } = useFetch<Document[]>('documents', {
    searchQuery: searchQuery.length > 2 ? searchQuery : undefined
  });

  // Filtrer par type si un type est sélectionné
  const filteredDocuments = documents?.filter(doc => 
    selectedType ? doc.type === selectedType : true
  );
  
  // Obtenir le nom de l'icône selon le type
  const getIconForType = (type: DocumentType) => {
    switch (type) {
      case DocumentType.DEVIS: return 'description';
      case DocumentType.FACTURE: return 'receipt';
      case DocumentType.BON_DE_COMMANDE: return 'shopping-cart';
      case DocumentType.BON_DE_LIVRAISON: return 'local-shipping';
      case DocumentType.FICHE_TECHNIQUE: return 'article';
      case DocumentType.PHOTO_CHANTIER: return 'photo-camera';
      case DocumentType.PLAN: return 'map';
      default: return 'insert-drive-file';
    }
  };
  
  // Fonction pour naviguer vers les détails d'un document
  const navigateToDocument = (id: number) => {
    // @ts-ignore - Ignorer les erreurs de typage pour contourner le problème
    router.push(`/(tabs)/documents/${id}`);
  };
  
  // Types de documents pour le filtre
  const documentTypes: DocumentType[] = [
    DocumentType.DEVIS,
    DocumentType.FACTURE,
    DocumentType.BON_DE_COMMANDE,
    DocumentType.BON_DE_LIVRAISON,
    DocumentType.FICHE_TECHNIQUE,
    DocumentType.PHOTO_CHANTIER,
    DocumentType.PLAN,
    DocumentType.AUTRE
  ];
  
  // Affiche le nom formaté du type de document
  const formatDocumentType = (type: DocumentType) => {
    return type.replace(/_/g, ' ');
  };
  
  // Rendu d'un élément de la liste
  const renderItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      className="bg-white shadow-sm rounded-lg mb-3 flex-row p-3"
      onPress={() => navigateToDocument(item.id)}
    >
      <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
        <MaterialIcons name={getIconForType(item.type)} size={24} color="#1e40af" />
      </View>
      
      <View className="flex-1 justify-center">
        <Text className="text-lg font-semibold text-gray-800">{item.reference}</Text>
        <Text className="text-sm text-gray-500">
          {formatDocumentType(item.type)} • {formatDate(item.issue_date)}
        </Text>
        
        {item.amount !== null && (
          <Text className="text-sm text-blue-800 font-medium mt-1">
            {item.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </Text>
        )}
      </View>
      
      <View className="justify-center">
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Documents',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      {/* Liste des documents */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-600">Chargement des documents...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text className="mt-4 text-gray-800 font-medium">Erreur de chargement</Text>
          <Text className="mt-2 text-gray-600 text-center">{error}</Text>
        </View>
      ) : filteredDocuments && filteredDocuments.length > 0 ? (
        <FlatList
          data={filteredDocuments}
          renderItem={renderItem}
          keyExtractor={(item: Document) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: filterVisible ? 240 : 100 }}
        />
      ) : (
        <View className="flex-1 justify-center items-center p-4">
          <MaterialIcons name="folder-open" size={64} color="#d1d5db" />
          <Text className="mt-4 text-gray-500 text-lg">
            {searchQuery.length > 0 || selectedType 
              ? "Aucun document ne correspond à votre recherche" 
              : "Aucun document disponible"}
          </Text>
        </View>
      )}
      
      {/* Barre de recherche et filtres en bas de l'écran */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 pb-6 shadow-lg">
        {/* Barre de recherche */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 flex-row bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 items-center">
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-gray-800"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            className="ml-2 bg-blue-50 p-2 rounded-lg border border-blue-200"
            onPress={() => setFilterVisible(!filterVisible)}
          >
            <MaterialIcons 
              name="filter-list" 
              size={24} 
              color={selectedType ? "#1e40af" : "#6b7280"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Filtres */}
        {filterVisible && (
          <View className="mb-4 bg-gray-50 p-3 rounded-lg">
            <Text className="font-medium text-gray-800 mb-2">Filtrer par type</Text>
            <View className="flex-row flex-wrap">
              <TouchableOpacity 
                className={`m-1 px-3 py-1 rounded-full border ${selectedType === null ? 'bg-blue-500 border-blue-600' : 'bg-gray-100 border-gray-200'}`}
                onPress={() => setSelectedType(null)}
              >
                <Text className={`${selectedType === null ? 'text-white' : 'text-gray-800'}`}>Tous</Text>
              </TouchableOpacity>
              
              {documentTypes.map(type => (
                <TouchableOpacity 
                  key={type}
                  className={`m-1 px-3 py-1 rounded-full border ${selectedType === type ? 'bg-blue-500 border-blue-600' : 'bg-gray-100 border-gray-200'}`}
                  onPress={() => setSelectedType(type)}
                >
                  <Text className={`${selectedType === type ? 'text-white' : 'text-gray-800'}`}>
                    {formatDocumentType(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}