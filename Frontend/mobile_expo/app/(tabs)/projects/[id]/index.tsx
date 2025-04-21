import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Text, 
  Linking, 
  Alert, 
  StyleSheet,
  Animated
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
    console.log(`[ProjectDetailScreen] toggleSection appelé pour: ${sectionName}`);
    // Approche directe sans conditions complexes
    setOpenSection(prevOpenSection => {
      const newOpenSection = prevOpenSection === sectionName ? '' : sectionName;
      console.log(`[ProjectDetailScreen] Nouvel état openSection: ${newOpenSection}`);
      return newOpenSection;
    });
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

  const handleTestButtonPress = () => {
    console.log("--- BOUTON TEST CLIC --- Le clic DANS le ScrollView fonctionne ! ---");
    Alert.alert("Test Clic", "Le clic DANS le ScrollView fonctionne !");
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
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.content}>
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
          
          {project.clients && (
            <ProjectClient 
              client={project.clients}
              isOpen={openSection === 'client'}
              onToggle={() => toggleSection('client')}
              onClientPress={handleClientPress}
            />
          )}
          
          {project.addresses && (
            <ProjectAddress 
              address={project.addresses}
              isOpen={openSection === 'address'}
              onToggle={() => toggleSection('address')}
              onLocationPress={handleLocationPress}
            />
          )}
          
          {project.project_stages && (
            <ProjectStages 
              stages={project.project_stages}
              isOpen={openSection === 'stages'}
              onToggle={() => toggleSection('stages')}
            />
          )}
          
          <ProjectStaff 
            projectId={Number(id)}
            isOpen={openSection === 'staff'}
            onToggle={() => toggleSection('staff')}
          />
          
          <ProjectMaterials 
            projectId={Number(id)}
            isOpen={openSection === 'materials'}
            onToggle={() => toggleSection('materials')}
          />
          
          <ProjectDocuments 
            projectId={Number(id)}
            isOpen={openSection === 'documents'}
            onToggle={() => toggleSection('documents')}
            onDocumentPress={handleDocumentPress}
          />
          
          <ProjectMedia 
            projectId={Number(id)}
            isOpen={openSection === 'media'}
            onToggle={() => toggleSection('media')}
          />
          
          {project.project_tags && project.project_tags.length > 0 && (
            <ProjectTags 
              tags={project.project_tags}
              isOpen={openSection === 'tags'}
              onToggle={() => toggleSection('tags')}
            />
          )}
          
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
  testButton: {
    backgroundColor: 'red',
    padding: 15,
    marginVertical: 20,
    alignItems: 'center',
    borderRadius: 5,
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
