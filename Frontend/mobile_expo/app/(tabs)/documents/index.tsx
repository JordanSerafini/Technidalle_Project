import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView, TextInput, ViewStyle, Animated, ScrollView } from "react-native";
import { useRouter, Stack, Link } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFetch } from '@/app/hooks/useFetch';
import { Document, DocumentType } from '@/app/utils/interfaces/document';
import { formatDate } from '@/app/utils/dateFormatter';

// Interface pour les props de AccordionItem
interface AccordionItemProps {
  isExpanded: boolean;
  children: React.ReactNode;
  maxHeight?: number;
}

// Composant AccordionItem pour l'animation
function AccordionItem({ isExpanded, children, maxHeight = 1000 }: AccordionItemProps) {
  const [height] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(height, {
      toValue: isExpanded ? maxHeight : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, maxHeight]);

  // Si l'accordéon est déplié, on n'applique pas de hauteur fixe
  if (isExpanded) {
    return (
      <View style={{ height: 'auto' }}>
        {children}
      </View>
    );
  }

  // Si l'accordéon est fermé, on utilise l'animation
  return (
    <Animated.View style={{ height, overflow: 'hidden' }}>
      {children}
    </Animated.View>
  );
}

export default function DocumentsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [documentsByMonth, setDocumentsByMonth] = useState<{ [key: string]: Document[] }>({});
  
  // Référence pour éviter les re-rendus en boucle
  const hasGroupedDocuments = useRef(false);
  
  // Récupération des documents
  const { data: documents, loading, error } = useFetch<Document[]>('documents', {
    searchQuery: searchQuery.length > 2 ? searchQuery : undefined
  });
  
  // Filtrer par type si un type est sélectionné
  const filteredDocuments = documents?.filter(doc => 
    selectedType ? doc.type === selectedType : true
  );
  
  // Regrouper les documents par mois
  useEffect(() => {
    if (filteredDocuments && !hasGroupedDocuments.current) {
      const grouped = filteredDocuments.reduce((acc, doc) => {
        const date = new Date(doc.issue_date);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        if (!acc[monthYear]) {
          acc[monthYear] = [];
        }
        acc[monthYear].push(doc);
        return acc;
      }, {} as { [key: string]: Document[] });
      
      // Trier les mois par ordre chronologique inverse (plus récent d'abord)
      const sortedGrouped = Object.keys(grouped)
        .sort((a, b) => {
          const [monthA, yearA] = a.split('/').map(Number);
          const [monthB, yearB] = b.split('/').map(Number);
          return (yearB - yearA) || (monthB - monthA);
        })
        .reduce((acc, key) => {
          acc[key] = grouped[key];
          return acc;
        }, {} as { [key: string]: Document[] });
      
      setDocumentsByMonth(sortedGrouped);
      
      // Initialiser tous les mois comme false
      const initialExpanded = Object.keys(sortedGrouped).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as { [key: string]: boolean });
      
      setExpandedSections(initialExpanded);
      hasGroupedDocuments.current = true;
    }
  }, [filteredDocuments]);
  
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
  
  // Formater l'affichage du mois en français
  const formatMonthYear = (monthYear: string) => {
    const [month, year] = monthYear.split('/');
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };
  
  // Toggle l'expansion d'une section
  const toggleSection = (monthYear: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [monthYear]: !prev[monthYear]
    }));
  };
  
  // Rendu d'un élément de la liste
  const renderItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      key={item.id}
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
  
  // Rendu des sections mensuelles
  const renderMonthSections = () => {
    return Object.entries(documentsByMonth).map(([monthYear, docs]) => (
      <View key={monthYear} className="mb-4">
        <TouchableOpacity 
          className="flex-row items-center bg-white rounded-lg p-3 shadow-sm"
          onPress={() => toggleSection(monthYear)}
        >
          <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
            <Text className="font-bold text-blue-800">{docs.length}</Text>
          </View>
          <Text className="flex-1 text-lg font-medium text-gray-800">{formatMonthYear(monthYear)}</Text>
          <Ionicons 
            name={expandedSections[monthYear] ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#6b7280" 
          />
        </TouchableOpacity>
        
        <AccordionItem isExpanded={expandedSections[monthYear]}>
          <View className="mt-2">
            {docs.map(doc => renderItem({ item: doc }))}
          </View>
        </AccordionItem>
      </View>
    ));
  };
  
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
        <ScrollView className="flex-1 px-4 pt-4 pb-32">
          {renderMonthSections()}
        </ScrollView>
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