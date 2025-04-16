import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { DocumentType } from '@/app/utils/interfaces/document';

export default function AddDocumentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // États du formulaire
  const [reference, setReference] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.AUTRE);
  const [notes, setNotes] = useState('');
  
  // Fonction pour soumettre le formulaire
  const handleSubmit = async () => {
    if (!reference) {
      Alert.alert('Erreur', 'Veuillez saisir une référence pour le document');
      return;
    }
    
    setLoading(true);
    
    try {
      // Préparer les données à envoyer
      const documentData = {
        reference,
        type: documentType,
        notes,
        issue_date: new Date().toISOString(),
        // Ajouter d'autres champs selon les besoins
      };
      
      // Envoyer les données à l'API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création du document');
      }
      
      const result = await response.json();
      
      // Redirection vers la liste des documents
      Alert.alert('Succès', 'Document créé avec succès', [
        { 
          text: 'OK', 
          onPress: () => router.back() 
        }
      ]);
      
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour annuler et revenir en arrière
  const handleCancel = () => {
    router.back();
  };
  
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Ajouter un document',
          headerRight: () => (
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="close" size={24} color="#3b82f6" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View className="p-4">
        {/* Formulaire */}
        <View className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <Text className="text-gray-700 font-medium mb-2">Référence*</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-2 mb-4"
            placeholder="Saisissez une référence"
            value={reference}
            onChangeText={setReference}
          />
          
          <Text className="text-gray-700 font-medium mb-2">Type de document</Text>
          <View className="border border-gray-300 rounded-lg mb-4">
            <Picker
              selectedValue={documentType}
              onValueChange={(itemValue) => setDocumentType(itemValue as DocumentType)}
            >
              <Picker.Item label="Devis" value={DocumentType.DEVIS} />
              <Picker.Item label="Facture" value={DocumentType.FACTURE} />
              <Picker.Item label="Bon de commande" value={DocumentType.BON_DE_COMMANDE} />
              <Picker.Item label="Bon de livraison" value={DocumentType.BON_DE_LIVRAISON} />
              <Picker.Item label="Fiche technique" value={DocumentType.FICHE_TECHNIQUE} />
              <Picker.Item label="Photo de chantier" value={DocumentType.PHOTO_CHANTIER} />
              <Picker.Item label="Plan" value={DocumentType.PLAN} />
              <Picker.Item label="Autre" value={DocumentType.AUTRE} />
            </Picker>
          </View>
          
          <Text className="text-gray-700 font-medium mb-2">Notes</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-2 mb-4"
            placeholder="Notes (optionnel)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={{ textAlignVertical: 'top' }}
          />
          
          {/* Boutons d'action */}
          <View className="flex-row mt-4">
            <TouchableOpacity 
              className="flex-1 mr-2 py-3 bg-gray-200 rounded-lg items-center justify-center"
              onPress={handleCancel}
            >
              <Text className="text-gray-800 font-medium">Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-1 ml-2 py-3 bg-blue-500 rounded-lg items-center justify-center"
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-medium">Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
} 