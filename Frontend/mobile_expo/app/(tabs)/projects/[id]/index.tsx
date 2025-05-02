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
// Import du modal d'ajout d'étape
import AddStageModal from '@/app/components/projects/AddStageModal';
import { Staff } from '@/app/utils/interfaces/staff.interface';
import url from '@/app/utils/url';

// Interface pour l'assignation de personnel à une étape (nécessaire pour le modal)
interface StaffAssignment {
  staffId: number;
  staffName: string;
  roleDescription?: string;
}

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

  // Fonction pour rafraîchir les données du projet
  const refreshProjectData = () => {
    // Recharger la page pour obtenir les données mises à jour
    router.replace(`/projects/${id}`);
  };

  // États pour le modal d'ajout d'étape
  const [isAddStageModalVisible, setIsAddStageModalVisible] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

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

  // Récupérer la liste du personnel disponible
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoadingStaff(true);
        // Utiliser directement l'URL locale du fichier url.ts
        const apiUrl = `${url.local}resources/staff`;
        console.log("Tentative de récupération du personnel depuis:", apiUrl);
        
        try {
          const controller = new AbortController();
          // Créer un timeout manuellement (compatible avec toutes les versions)
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId); // Annuler le timeout si la requête aboutit
          
          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }
          
          const data = await response.json();
          console.log(`Personnel récupéré: ${data.length} membres`);
          setAvailableStaff(data);
        } catch (fetchError) {
          console.error('Erreur fetch staff:', fetchError);
          
          // En cas d'échec, utiliser des données fictives pour le développement
          console.warn("Utilisation de données fictives pour le personnel");
          const mockStaff: Staff[] = [
            { id: 1, firstname: 'Jean', lastname: 'Dupont', email: 'jean@example.com', role_id: 1, hire_date: new Date('2020-01-01') },
            { id: 2, firstname: 'Marie', lastname: 'Martin', email: 'marie@example.com', role_id: 2, hire_date: new Date('2021-03-15') },
            { id: 3, firstname: 'Pierre', lastname: 'Durand', email: 'pierre@example.com', role_id: 3, hire_date: new Date('2022-06-30') }
          ];
          setAvailableStaff(mockStaff);
        }
      } finally {
        setIsLoadingStaff(false);
      }
    };

    // On charge les données du personnel lorsque le modal est ouvert
    if (isAddStageModalVisible) {
      fetchStaff();
    }
  }, [isAddStageModalVisible]);

  // Fonctions pour le modal d'ajout d'étape
  const handleAddStage = () => {
    console.log('Ouverture du modal d\'ajout d\'étape');
    setIsAddStageModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsAddStageModalVisible(false);
  };

  const handleSubmitStage = async (stageData: any, staffAssignments: StaffAssignment[]) => {
    try {
      console.log('Données de l\'étape à soumettre:', stageData);
      console.log('Personnel à assigner:', staffAssignments);
      
      // Conversion des noms de champs en snake_case pour correspondre au modèle Prisma
      const stageDataForPrisma = {
        name: stageData.name,
        description: stageData.description,
        // Supprimer project_id car il est géré par la relation projects
        start_date: stageData.startDate,
        end_date: stageData.endDate,
        order_index: stageData.orderIndex,
        status: stageData.status,
        estimated_duration: stageData.estimatedDuration,
        notes: stageData.notes,
        completion_percentage: 0,
        // Relation avec le projet
        projects: {
          connect: {
            id: Number(id) // Assurez-vous que l'ID est un nombre
          }
        }
      };
      
      console.log('Données formatées pour Prisma:', stageDataForPrisma);
      
      // 1. Créer l'étape - Utiliser un chemin explicite vers l'API Gateway
      // Essayer avec l'URL complète de l'API Gateway pour déboguer
      const stageResponse = await fetch(`${url.local}projects/${id}/stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(stageDataForPrisma)
      });
      
      // Log la réponse complète pour débogage
      console.log('Status code:', stageResponse.status);
      console.log('Status text:', stageResponse.statusText);
      
      if (!stageResponse.ok) {
        // Essayer de lire le corps de la réponse pour plus de détails
        let errorMessage;
        try {
          const errorData = await stageResponse.json();
          errorMessage = JSON.stringify(errorData);
        } catch (e) {
          errorMessage = await stageResponse.text();
        }
        console.error('Détails de l\'erreur:', errorMessage);
        throw new Error('Erreur lors de la création de l\'étape');
      }
      
      const newStage = await stageResponse.json();
      console.log('Étape créée avec succès:', newStage);
      
      // 2. Assigner le personnel si nécessaire
      if (staffAssignments.length > 0) {
        // Utiliser le bon endpoint et le bon format de données
        for (const assignment of staffAssignments) {
          try {
            const staffAssignmentResponse = await fetch(`${url.local}events/assign-staff`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                projectId: Number(id), // ID du projet
                staffId: assignment.staffId, // ID du membre du personnel
                stageId: newStage.id, // ID de la nouvelle étape
                roleDescription: assignment.roleDescription || 'Membre d\'équipe',
                startDate: stageDataForPrisma.start_date, // Utiliser la date de début de l'étape
                endDate: stageDataForPrisma.end_date, // Utiliser la date de fin de l'étape
                // hoursPlanned: ... // Non disponible ici, gérer séparément si nécessaire
              })
            });
            
            if (!staffAssignmentResponse.ok) {
              console.warn(`Erreur lors de l'assignation du membre ${assignment.staffName}: ${staffAssignmentResponse.status}`);
            } else {
              console.log(`Membre ${assignment.staffName} assigné avec succès à l'étape ${newStage.name}`);
            }
          } catch (assignError) {
            console.error(`Erreur critique lors de l'assignation de ${assignment.staffName}:`, assignError);
          }
        }
      }
      
      // 3. Rafraîchir les données du projet pour afficher la nouvelle étape
      refreshProjectData();
      
      // 4. Fermer le modal
      setIsAddStageModalVisible(false);
      
      // 5. Afficher une confirmation
      Alert.alert('Succès', 'L\'étape a été ajoutée avec succès');
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'étape:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'ajout de l\'étape');
    }
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
              projectId={Number(id)}
              stages={project.project_stages as any}
              isOpen={openSection === 'stages'}
              onToggle={() => toggleSection('stages')}
              onAddStage={handleAddStage}
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

      {/* Modal d'ajout d'étape */}
      <AddStageModal
        isVisible={isAddStageModalVisible}
        onClose={handleCloseModal}
        onSubmit={handleSubmitStage}
        projectId={Number(id)}
        existingStagesCount={project?.project_stages?.length || 0}
        availableStaff={availableStaff}
      />
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
