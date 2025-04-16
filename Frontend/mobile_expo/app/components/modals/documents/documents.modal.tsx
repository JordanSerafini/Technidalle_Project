import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { CreateDocumentDto } from '../../../utils/interfaces/document.interface';
import { useFetch } from '../../../hooks/useFetch';
import { url as urlConfig } from '../../../utils/url';

interface DocumentsModalProps {
  visible: boolean;
  onClose: () => void;
  projectId?: number;
  clientId?: number;
  onSuccess?: () => void;
}

export const DocumentsModal: React.FC<DocumentsModalProps> = ({
  visible,
  onClose,
  projectId,
  clientId,
  onSuccess
}) => {
  console.log('DocumentsModal rendu - visible:', visible);
  
  const [documentName, setDocumentName] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [documentType, setDocumentType] = useState<string>('facture');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Effet pour surveiller les changements de visibilité
  useEffect(() => {
    console.log('État de la modale a changé - visible:', visible);
  }, [visible]);

  // Types de documents disponibles
  const documentTypes = [
    { id: 'facture', label: 'Facture' },
    { id: 'devis', label: 'Devis' },
    { id: 'contrat', label: 'Contrat' },
    { id: 'photo', label: 'Photo' },
    { id: 'autre', label: 'Autre' }
  ];

  // Fonction pour sélectionner un document - Version de simulation pour test
  const pickDocument = async () => {
    console.log('Sélection de document');
    // Simulation de la sélection d'un fichier
    const mockFile = {
      uri: 'file://mock/document.pdf',
      name: 'document-test.pdf',
      mimeType: 'application/pdf',
      size: 1024 * 100 // 100KB
    };
    
    setSelectedFile(mockFile);
    if (!documentName) {
      setDocumentName('Document Test');
    }
    
    Alert.alert(
      "Fichier sélectionné (simulation)",
      "Un fichier test a été ajouté pour la démonstration.",
      [{ text: "OK" }]
    );
  };

  // Fonction pour sélectionner une image depuis la galerie - Version de simulation pour test
  const pickImage = async () => {
    // Simulation de la sélection d'une image
    const mockImage = {
      uri: 'file://mock/image.jpg',
      name: 'image-test.jpg',
      mimeType: 'image/jpeg',
      size: 1024 * 200 // 200KB
    };
    
    setSelectedFile(mockImage);
    setDocumentType('photo');
    if (!documentName) {
      setDocumentName(`Photo Test ${new Date().toLocaleString('fr-FR')}`);
    }
    
    Alert.alert(
      "Image sélectionnée (simulation)",
      "Une image test a été ajoutée pour la démonstration.",
      [{ text: "OK" }]
    );
  };

  // Fonction pour prendre une photo - Version de simulation pour test
  const takePhoto = async () => {
    // Simulation de la prise d'une photo
    const mockPhoto = {
      uri: 'file://mock/camera.jpg',
      name: 'photo-test.jpg',
      mimeType: 'image/jpeg',
      size: 1024 * 300 // 300KB
    };
    
    setSelectedFile(mockPhoto);
    setDocumentType('photo');
    if (!documentName) {
      setDocumentName(`Photo Appareil Test ${new Date().toLocaleString('fr-FR')}`);
    }
    
    Alert.alert(
      "Photo prise (simulation)",
      "Une photo test a été ajoutée pour la démonstration.",
      [{ text: "OK" }]
    );
  };

  // Hook personnalisé pour l'API fetch
  const { data, loading, error: apiError } = useFetch<any>(null, { method: 'POST' });

  // Fonction pour soumettre le document
  const handleSubmit = async () => {
    if (!documentName.trim()) {
      setErrorMessage('Veuillez donner un nom au document');
      return;
    }

    if (!selectedFile) {
      setErrorMessage('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Création de l'objet FormData pour l'upload du fichier
      const formData = new FormData();
      
      // Ajout du fichier avec le bon type MIME
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name || `document_${Date.now()}.${selectedFile.uri.split('.').pop()}`,
        type: selectedFile.mimeType || 'application/octet-stream'
      } as any);

      // Ajout des données du document
      const documentData: CreateDocumentDto = {
        name: documentName,
        description: documentDescription,
        document_type: documentType,
        client_id: clientId,
        project_id: projectId
      };

      Object.keys(documentData).forEach(key => {
        if (documentData[key] !== undefined) {
          formData.append(key, documentData[key]);
        }
      });

      // Appel à l'API pour créer le document
      const url = `${urlConfig.local}documents`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Document créé avec succès:', responseData);

      // Réinitialisation du formulaire et fermeture du modal
      resetForm();
      onSuccess?.();
      onClose();
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du document:', error);
      setErrorMessage('Erreur lors de l\'envoi du document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Réinitialisation du formulaire
  const resetForm = () => {
    setDocumentName('');
    setDocumentDescription('');
    setSelectedFile(null);
    setDocumentType('facture');
    setErrorMessage(null);
  };

  // Fonction pour fermer le modal et réinitialiser le formulaire
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ajouter un document</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer}>
            {errorMessage && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nom du document*</Text>
              <TextInput
                style={styles.input}
                value={documentName}
                onChangeText={setDocumentName}
                placeholder="Entrez le nom du document"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={documentDescription}
                onChangeText={setDocumentDescription}
                placeholder="Décrivez brièvement ce document"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Type de document</Text>
              <View style={styles.typeContainer}>
                {documentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeButton,
                      documentType === type.id && styles.typeButtonSelected
                    ]}
                    onPress={() => setDocumentType(type.id)}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        documentType === type.id && styles.typeTextSelected
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Fichier*</Text>
              {selectedFile ? (
                <View style={styles.filePreview}>
                  <MaterialIcons name="insert-drive-file" size={24} color="#4C89C8" />
                  <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                    {selectedFile.name || selectedFile.uri.split('/').pop()}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedFile(null)}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadOptions}>
                  <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                    <MaterialIcons name="upload-file" size={22} color="#fff" />
                    <Text style={styles.uploadButtonText}>Choisir un fichier</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                    <MaterialIcons name="photo-library" size={22} color="#fff" />
                    <Text style={styles.uploadButtonText}>Galerie</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                    <MaterialIcons name="camera-alt" size={22} color="#fff" />
                    <Text style={styles.uploadButtonText}>Appareil photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.submitButton, (!documentName || !selectedFile || isSubmitting) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!documentName || !selectedFile || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    padding: 15,
    maxHeight: '70%',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  typeButtonSelected: {
    backgroundColor: '#4C89C8',
  },
  typeText: {
    color: '#666',
    fontSize: 14,
  },
  typeTextSelected: {
    color: '#fff',
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4C89C8',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    marginRight: 5,
    minWidth: '30%',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#d0e1f9',
  },
  fileName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#4C89C8',
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#a0c0e0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FFE8E8',
    borderWidth: 1,
    borderColor: '#FFD0D0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#D8000C',
    fontSize: 14,
  },
});

export default DocumentsModal;
