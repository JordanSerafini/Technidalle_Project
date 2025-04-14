import React, { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity, Text, Linking, Alert } from 'react-native';
import { useFetch } from '../../../hooks/useFetch';
import { Project, project_status } from '../../../utils/interfaces/project.interface';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Import des composants refactorisés
import { ProjectHeader } from './ProjectHeader';
import { ProjectInfo } from './ProjectInfo';
import { ProjectClient } from './ProjectClient';
import { ProjectAddress } from './ProjectAddress';
import { ProjectStages } from './ProjectStages';
import { ProjectTags } from './ProjectTags';
import { ProjectNotes } from './ProjectNotes';
import { ProjectStaff } from './ProjectStaff';
import { ProjectMaterials } from './ProjectMaterials';
import { ProjectDocuments } from './ProjectDocuments';
import { ProjectMedia } from './ProjectMedia';

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { data: project, loading, error } = useFetch<Project>(`projects/${id}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
    }
  });

  // États pour gérer l'ouverture/fermeture des sections
  const [sections, setSections] = useState({
    infos: true,
    client: false,
    adresse: false,
    etapes: false,
    tags: false,
    notes: false,
    personnel: false,
    materiaux: false,
    documents: false,
    medias: false
  });

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Configuration de l'en-tête
  useEffect(() => {
    if (project) {
      navigation.setOptions({
        title: project.name,
        headerShown: true
      });
    }
  }, [project, navigation]);

  const handleClientPress = (clientId: number) => {
    router.push({
      pathname: "/(tabs)/clients/[id]",
      params: { id: clientId }
    });
  };

  const handleLocationPress = () => {
    const address = project?.addresses;
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

  const handleDocumentPress = (document: any) => {
    if (document.file_path) {
      Linking.openURL(document.file_path);
    } else {
      Alert.alert(
        "Document", 
        `Référence: ${document.reference}\nType: ${document.type}\nStatut: ${document.status || 'Non défini'}\nMontant: ${document.amount ? document.amount.toLocaleString('fr-FR') + '€' : 'Non défini'}`
      );
    }
  };

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
        {/* <ProjectHeader name={project.name} /> */}

        {/* Informations principales */}
        <ProjectInfo
          reference={project.reference}
          name={project.name}
          status={project.status}
          start_date={project.start_date}
          end_date={project.end_date}
          budget={project.budget}
          description={project.description}
          isOpen={sections.infos}
          onToggle={() => toggleSection('infos')}
        />

        {/* Informations du client */}
        {project.clients && (
          <ProjectClient
            client={project.clients}
            isOpen={sections.client}
            onToggle={() => toggleSection('client')}
            onClientPress={handleClientPress}
          />
        )}

        {/* Adresse */}
        {project.addresses && (
          <ProjectAddress
            address={project.addresses}
            isOpen={sections.adresse}
            onToggle={() => toggleSection('adresse')}
            onLocationPress={handleLocationPress}
          />
        )}

        {/* Étapes du projet */}
        {project.project_stages && (
          <ProjectStages
            stages={project.project_stages}
            isOpen={sections.etapes}
            onToggle={() => toggleSection('etapes')}
          />
        )}

        {/* Personnel assigné au projet */}
        <ProjectStaff
          projectId={id}
          isOpen={sections.personnel}
          onToggle={() => toggleSection('personnel')}
        />

        {/* Matériaux utilisés dans le projet */}
        <ProjectMaterials
          projectId={id}
          isOpen={sections.materiaux}
          onToggle={() => toggleSection('materiaux')}
        />

        {/* Documents du projet */}
        <ProjectDocuments
          projectId={id}
          isOpen={sections.documents}
          onToggle={() => toggleSection('documents')}
          onDocumentPress={handleDocumentPress}
        />

        {/* Médias du projet */}
        <ProjectMedia
          projectId={id}
          isOpen={sections.medias}
          onToggle={() => toggleSection('medias')}
        />

        {/* Tags du projet */}
        {project.project_tags && project.project_tags.length > 0 && (
          <ProjectTags
            tags={project.project_tags}
            isOpen={sections.tags}
            onToggle={() => toggleSection('tags')}
          />
        )}

        {/* Notes */}
        {project.notes && (
          <ProjectNotes
            notes={project.notes}
            isOpen={sections.notes}
            onToggle={() => toggleSection('notes')}
          />
        )}
      </ScrollView>
    </View>
  );
}
