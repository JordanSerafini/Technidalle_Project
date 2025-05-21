import React from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface AttachmentButtonProps {
  onFileSelected: (uri: string, type: string, name: string) => void;
}

const AttachmentButton: React.FC<AttachmentButtonProps> = ({ onFileSelected }) => {
  const handleAttachment = () => {
    Alert.alert(
      "Ajouter une pièce jointe",
      "Choisissez le type de fichier",
      [
        {
          text: "Photo",
          onPress: pickImage,
        },
        {
          text: "Document",
          onPress: pickDocument,
        },
        {
          text: "Annuler",
          style: "cancel",
        },
      ]
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Extraire le nom du fichier de l'URI
        const name = asset.uri.split('/').pop() || 'image.jpg';
        onFileSelected(asset.uri, 'image', name);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de l'image:", error);
      Alert.alert("Erreur", "Impossible de charger l'image");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/msword', 
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onFileSelected(asset.uri, asset.mimeType || 'application/octet-stream', asset.name);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection du document:", error);
      Alert.alert("Erreur", "Impossible de charger le document");
    }
  };

  return (
    <TouchableOpacity
      onPress={handleAttachment}
      className="p-2 mr-1"
    >
      <Ionicons name="attach" size={24} color="#6b7280" />
    </TouchableOpacity>
  );
};

export default AttachmentButton; 