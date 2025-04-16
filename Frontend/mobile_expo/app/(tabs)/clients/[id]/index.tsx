import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity, Text, Linking, Alert } from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { Document } from '@/app/utils/interfaces/document';
import useFetch from '@/app/hooks/useFetch';
import { useClientsStore } from '@/app/store/clientsStore';
import { Project } from '@/app/utils/interfaces/project.interface';

// Import des composants refactorisés
import { ClientHeader } from '@/app/(tabs)/clients/[id]/ClientHeader';
import { ClientCoordinates } from '@/app/(tabs)/clients/[id]/ClientCoordinates';
import { ClientAddress } from '@/app/(tabs)/clients/[id]/ClientAddress';
import { ClientProjects } from '@/app/(tabs)/clients/[id]/ClientProjects';
import { ClientDocuments } from '@/app/(tabs)/clients/[id]/ClientDocuments';
import { ClientNotes } from '@/app/(tabs)/clients/[id]/ClientNotes';

export default function ClientDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedClient, setSelectedClient } = useClientsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Utiliser l'ID du paramètre d'URL
  const clientId = id || (selectedClient?.id?.toString() || null);
  
  // Charger le client depuis l'API si nécessaire
  useEffect(() => {
    if (clientId && !selectedClient) {
      setLoading(true);
      fetch(`${process.env.EXPO_PUBLIC_API_URL}/clients/${clientId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Erreur lors du chargement du client');
          }
          return response.json();
        })
        .then(data => {
          setSelectedClient(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [clientId, selectedClient]);
  
  const { data: documents, loading: isDocumentsLoading, error: documentsError } = useFetch<Document[]>(
    clientId ? `documents/client/${clientId}` : null
  );

  const { data: projects, loading: isProjectsLoading, error: projectsError } = useFetch<Project[]>(
    clientId ? `projects/client/${clientId}` : null
  );

  // États pour gérer l'ouverture/fermeture des sections
  const [sections, setSections] = useState({
    coordonnees: false,
    adresse: false,
    documents: false,
    notes: false,
    projets: false
  });

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Configuration de l'en-tête
  useEffect(() => {
    if (selectedClient) {
      navigation.setOptions({
        title: `CLI00${selectedClient.id}`,
        headerShown: true
      });

      // Ajouter un listener pour le focus de l'écran
      const unsubscribe = navigation.addListener('beforeRemove', () => {
        setSelectedClient(null);
      });

      return unsubscribe;
    }
  }, [selectedClient, navigation, router]);

  // État de chargement
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-4 text-gray-600">Chargement du client...</Text>
      </View>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-500">Erreur: {error}</Text>
        <TouchableOpacity 
          onPress={() => router.navigate('/(tabs)/clients')}
          className="mt-4 bg-blue-500 p-3 rounded-lg"
        >
          <Text className="text-white">Retour à la liste des clients</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Si aucun client n'est sélectionné, ne rien afficher pendant la redirection
  if (!selectedClient) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-4 text-gray-600">Chargement...</Text>
      </View>
    );
  }

  const handleCall = (phoneNumber: string) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("Information", "Numéro de téléphone non disponible");
    }
  };

  const handleEmail = (email: string) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    } else {
      Alert.alert("Information", "Adresse email non disponible");
    }
  };

  const handleLocation = () => {
    const address = selectedClient.addresses;
    if (address?.latitude && address?.longitude) {
      const url = `https://maps.google.com/?q=${address.latitude},${address.longitude}`;
      Linking.openURL(url);
    } else if (address) {
      const query = `${address.street_number || ''} ${address.street_name}, ${address.zip_code} ${address.city}, ${address.country || 'France'}`;
      const url = `https://maps.google.com/?q=${encodeURIComponent(query)}`;
      Linking.openURL(url);
    } else {
      Alert.alert("Information", "Adresse non disponible");
    }
  };

  const handleDocumentPress = (documentId: number) => {
    router.push({
      pathname: "/(tabs)/documents/[id]",
      params: { id: documentId }
    });
  };

  const handleProjectPress = (projectId: number) => {
    router.push({
      pathname: "/(tabs)/projects",
      params: { projectId }
    });
  };

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4">
        {/* En-tête du client */}
        <ClientHeader 
          firstname={selectedClient.firstname}
          lastname={selectedClient.lastname}
          company_name={selectedClient.company_name}
          siret={selectedClient.siret}
        />

        {/* Coordonnées */}
        <ClientCoordinates 
          email={selectedClient.email}
          phone={selectedClient.phone}
          mobile={selectedClient.mobile}
          isOpen={sections.coordonnees}
          onToggle={() => toggleSection('coordonnees')}
          onEmailPress={handleEmail}
          onPhonePress={handleCall}
        />

        {/* Adresse */}
        {selectedClient.addresses && (
          <ClientAddress 
            address={selectedClient.addresses}
            isOpen={sections.adresse}
            onToggle={() => toggleSection('adresse')}
            onLocationPress={handleLocation}
          />
        )}

        {/* Projets */}
        <ClientProjects 
          projects={projects || undefined}
          isLoading={isProjectsLoading}
          error={projectsError}
          isOpen={sections.projets}
          onToggle={() => toggleSection('projets')}
          onProjectPress={handleProjectPress}
        />

        {/* Documents */}
        <ClientDocuments 
          documents={documents || undefined}
          isLoading={isDocumentsLoading}
          error={documentsError}
          isOpen={sections.documents}
          onToggle={() => toggleSection('documents')}
          onDocumentPress={handleDocumentPress}
        />

        {/* Notes */}
        {selectedClient.notes && (
          <ClientNotes 
            notes={selectedClient.notes}
            isOpen={sections.notes}
            onToggle={() => toggleSection('notes')}
          />
        )}
      </View>
    </ScrollView>
  );
}

