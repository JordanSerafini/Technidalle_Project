import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Text, 
  Linking, 
  Alert, 
  StyleSheet
} from 'react-native';
import { useFetch } from '../../../hooks/useFetch';
import { Project, project_status } from '../../../utils/interfaces/project.interface';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Import des composants refactorisés
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

  // État simple pour les sections
  const [openSection, setOpenSection] = useState<string>('infos');

  // Fonction pour l'ouverture des sections
  const toggleSection = (sectionName: string) => {
    
    // Approche directe sans conditions complexes
    setOpenSection(openSection === sectionName ? '' : sectionName);
  };
  


  // Configuration de l'en-tête
  useEffect(() => {
    if (project) {
      navigation.setOptions({
        title: project.reference,
        headerShown: true
      });
    }
  }, [project, navigation]);

  const handleClientPress = (clientId: number) => {
    router.push({
      pathname: "/(tabs)/clients/[id]",
      params: { id: clientId.toString() }
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Projet non trouvé</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.content}>
          {/* Informations principales */}
          <ProjectInfo
            reference={project.reference}
            name={project.name}
            status={project.status}
            start_date={project.start_date}
            end_date={project.end_date}
            budget={project.budget}
            description={project.description}
            isOpen={openSection === 'infos'}
            onToggle={() => toggleSection('infos')}
          />

          {/* Informations du client */}
          {project.clients && (
            <ProjectClient
              client={project.clients}
              isOpen={openSection === 'client'}
              onToggle={() => toggleSection('client')}
              onClientPress={handleClientPress}
            />
          )}

          {/* Adresse */}
          {project.addresses && (
            <ProjectAddress
              address={project.addresses}
              isOpen={openSection === 'adresse'}
              onToggle={() => toggleSection('adresse')}
              onLocationPress={handleLocationPress}
            />
          )}

          {/* Étapes du projet */}
          {project.project_stages && (
            <ProjectStages
              stages={project.project_stages}
              isOpen={openSection === 'etapes'}
              onToggle={() => toggleSection('etapes')}
            />
          )}

          {/* Personnel assigné au projet */}
          <ProjectStaff
            projectId={id}
            isOpen={openSection === 'personnel'}
            onToggle={() => toggleSection('personnel')}
          />

          {/* Matériaux utilisés dans le projet */}
          <ProjectMaterials
            projectId={id}
            isOpen={openSection === 'materiaux'}
            onToggle={() => toggleSection('materiaux')}
          />

          {/* Documents du projet */}
          <ProjectDocuments
            projectId={id}
            isOpen={openSection === 'documents'}
            onToggle={() => toggleSection('documents')}
            onDocumentPress={handleDocumentPress}
          />

          {/* Médias du projet */}
          <ProjectMedia
            projectId={id}
            isOpen={openSection === 'medias'}
            onToggle={() => toggleSection('medias')}
          />

          {/* Tags du projet */}
          {project.project_tags && project.project_tags.length > 0 && (
            <ProjectTags
              tags={project.project_tags}
              isOpen={openSection === 'tags'}
              onToggle={() => toggleSection('tags')}
            />
          )}

          {/* Notes */}
          {project.notes && (
            <ProjectNotes
              notes={project.notes}
              isOpen={openSection === 'notes'}
              onToggle={() => toggleSection('notes')}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContentContainer: {
    paddingBottom: 20, // Espacement minimal en bas
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3F51B5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  }
});
