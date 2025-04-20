import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image, Dimensions, Share, Alert, Linking, SafeAreaView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFetch } from '@/app/hooks/useFetch';
import { Document, DocumentStatus, DocumentType } from '@/app/utils/interfaces/document';
import { formatDate } from '@/app/utils/dateFormatter';
import { url as urlConfig } from '@/app/utils/url';
import * as WebBrowser from 'expo-web-browser';

export default function DocumentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [imageExpanded, setImageExpanded] = useState(false);
  
  // Récupérer les détails du document
  const { data: document, loading, error } = useFetch<Document>(`documents/${id}`);
  
  // Dimensions de l'écran pour l'affichage des images
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  
  // Fonction pour partager le document
  const shareDocument = async () => {
    if (!document) return;
    
    try {
      await Share.share({
        title: `Document: ${document.reference}`,
        message: `Référence: ${document.reference}\nType: ${document.type}\nDate: ${formatDate(document.issue_date)}`,
        url: document.file_path || '',
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager ce document');
    }
  };
  
  // Fonction pour télécharger le PDF avec option d'envoi par email
  const downloadPdfWithEmail = async () => {
    if (!document || document.type !== 'devis') return;
    
    try {
      // Créer deux URLs : une pour le téléchargement seul et une pour l'envoi d'email
      const downloadUrl = `${urlConfig.local}devis/${document.id}/pdf`;
      const emailUrl = `${urlConfig.local}devis/${document.id}/pdf?sendEmail=true`;
      
      console.log("URL pour téléchargement:", downloadUrl);
      console.log("URL pour email:", emailUrl);
      
      Alert.alert(
        "Options de document",
        "Que souhaitez-vous faire avec ce document?",
        [
          {
            text: "Annuler",
            style: "cancel"
          },
          { 
            text: "Télécharger seulement", 
            onPress: () => {
              console.log("Tentative de téléchargement seul");
              Linking.openURL(downloadUrl).catch(err => {
                console.error("Erreur de téléchargement:", err);
                Alert.alert('Erreur', 'Impossible de télécharger le document');
              });
            }
          },
          {
            text: "Télécharger et envoyer par email",
            onPress: () => {
              console.log("Tentative de téléchargement + email");
              fetch(emailUrl, { method: 'GET' })
                .then(response => {
                  console.log("Réponse du serveur:", response.status);
                  if (response.ok) {
                    Alert.alert('Succès', 'Le document a été envoyé par email');
                    // Télécharger le PDF
                    Linking.openURL(downloadUrl).catch(err => {
                      console.error("Erreur après email:", err);
                    });
                  } else {
                    Alert.alert('Erreur', 'Problème lors de l\'envoi du document');
                  }
                })
                .catch(error => {
                  console.error("Erreur fetch:", error);
                  Alert.alert('Erreur', 'Problème de connexion au serveur');
                });
            }
          }
        ]
      );
    } catch (error) {
      console.error("Erreur générale:", error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };
  
  // Fonction pour consulter le document
  const viewDocument = () => {
    if (!document?.file_path) return;
    
    Linking.openURL(document.file_path).catch((err) => {
      console.error("Erreur viewDocument:", err);
      Alert.alert('Erreur', 'Impossible d\'ouvrir ce document');
    });
  };
  
  // Fonction pour télécharger le PDF avec option d'envoi par email via le navigateur
  const openPdfInBrowser = async () => {
    if (!document || document.type !== 'devis') return;
    
    try {
      // URL pour télécharger le PDF avec envoi d'email
      const url = `${urlConfig.local}devis/${document.id}/pdf?sendEmail=true`;
      console.log("Ouverture dans le navigateur:", url);
      
      Alert.alert(
        "Téléchargement via navigateur",
        "Le document sera ouvert dans votre navigateur et un email sera envoyé",
        [
          {
            text: "Annuler",
            style: "cancel"
          },
          { 
            text: "Confirmer", 
            onPress: async () => {
              try {
                // Utilisation de WebBrowser d'Expo pour une ouverture plus fiable
                const result = await WebBrowser.openBrowserAsync(url);
                console.log("Résultat WebBrowser:", result);
              } catch (error) {
                console.error("Erreur WebBrowser:", error);
                Alert.alert('Erreur', 'Impossible d\'ouvrir le navigateur');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Erreur openPdfInBrowser:", error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le navigateur');
    }
  };
  
  // Fonction pour obtenir la couleur en fonction du statut
  const getStatusColor = (status: DocumentStatus | null) => {
    switch (status) {
      case 'valide': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'refuse': return 'bg-red-100 text-red-800';
      case 'annule': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };
  
  // Fonction pour obtenir l'icône en fonction du type de document
  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'devis': return 'description';
      case 'facture': return 'receipt';
      case 'bon_de_commande': return 'shopping-cart';
      case 'bon_de_livraison': return 'local-shipping';
      case 'fiche_technique': return 'article';
      case 'photo_chantier': return 'photo-camera';
      case 'plan': return 'map';
      default: return 'insert-drive-file';
    }
  };
  
  // Rendu du contenu principal
  const renderContent = () => {
    if (loading) {
      return (
        <View className="flex-1 justify-center items-center p-10">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-600">Chargement du document...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View className="flex-1 justify-center items-center p-10">
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text className="mt-4 text-gray-800 font-medium">Erreur de chargement</Text>
          <Text className="mt-2 text-gray-600">{error}</Text>
          <TouchableOpacity 
            className="mt-6 px-4 py-2 bg-blue-500 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white font-medium">Retour</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (!document) {
      return (
        <View className="flex-1 justify-center items-center p-10">
          <Text className="text-gray-800 font-medium">Document introuvable</Text>
        </View>
      );
    }
    
    // On a un document à afficher
    return (
      <View style={{ paddingBottom: 100 }}>
        {/* En-tête du document */}
        <View className="bg-white p-5 rounded-lg shadow-sm mb-4">
          <View className="flex-row items-center mb-3">
            <MaterialIcons name={getDocumentIcon(document.type)} size={28} color="#1e40af" />
            <Text className="ml-3 text-xl font-bold text-gray-800">{document.reference}</Text>
          </View>
          
          <View className="flex-row flex-wrap">
            <View className={`px-3 py-1 rounded-full mr-2 mb-2 ${getStatusColor(document.status)}`}>
              <Text className="font-medium">
                {document.status || 'brouillon'}
              </Text>
            </View>
            <View className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 mr-2 mb-2">
              <Text className="font-medium">
                {document.type.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Informations du document */}
        <View className="bg-white p-5 rounded-lg shadow-sm mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Informations</Text>
          
          <View className="mb-3">
            <Text className="text-gray-500">Date d'émission</Text>
            <Text className="text-gray-800 font-medium">{formatDate(document.issue_date)}</Text>
          </View>
          
          {document.due_date && (
            <View className="mb-3">
              <Text className="text-gray-500">Date d'échéance</Text>
              <Text className="text-gray-800 font-medium">{formatDate(document.due_date)}</Text>
            </View>
          )}
          
          {document.amount !== null && (
            <View className="mb-3">
              <Text className="text-gray-500">Montant</Text>
              <Text className="text-gray-800 font-medium">
                {document.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </Text>
            </View>
          )}
          
          {document.tva_rate !== null && (
            <View className="mb-3">
              <Text className="text-gray-500">Taux TVA</Text>
              <Text className="text-gray-800 font-medium">{document.tva_rate}%</Text>
            </View>
          )}
          
          {document.payment_method && (
            <View className="mb-3">
              <Text className="text-gray-500">Mode de paiement</Text>
              <Text className="text-gray-800 font-medium">{document.payment_method}</Text>
            </View>
          )}
          
          {document.payment_date && (
            <View className="mb-3">
              <Text className="text-gray-500">Date de paiement</Text>
              <Text className="text-gray-800 font-medium">{formatDate(document.payment_date)}</Text>
            </View>
          )}
        </View>
        
        {/* Notes */}
        {document.notes && (
          <View className="bg-white p-5 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Notes</Text>
            <Text className="text-gray-700">{document.notes}</Text>
          </View>
        )}
        
        {/* Photos de chantier (traitement spécial) */}
        {document.file_path && document.type === 'photo_chantier' && (
          <View className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
            <TouchableOpacity 
              onPress={() => setImageExpanded(!imageExpanded)}
              className="w-full"
            >
              <Image 
                source={{ uri: document.file_path }} 
                style={{ 
                  width: '100%', 
                  height: imageExpanded ? screenHeight * 0.6 : 200,
                  resizeMode: 'cover' 
                }} 
              />
              <View className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1">
                <Ionicons 
                  name={imageExpanded ? "contract" : "expand"} 
                  size={24} 
                  color="white" 
                />
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Actions spécifiques pour les devis */}
        {document.type === 'devis' && (
          <View className="bg-white p-5 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Actions</Text>
            
            <TouchableOpacity 
              className="flex-row items-center p-3 bg-blue-50 rounded-lg mb-2"
              onPress={downloadPdfWithEmail}
            >
              <MaterialIcons name="email" size={24} color="#3b82f6" />
              <Text className="ml-3 flex-1 text-blue-800">Télécharger et envoyer par email</Text>
              <Ionicons name="download-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-row items-center p-3 bg-blue-50 rounded-lg mb-2"
              onPress={openPdfInBrowser}
            >
              <MaterialIcons name="open-in-browser" size={24} color="#3b82f6" />
              <Text className="ml-3 flex-1 text-blue-800">Ouvrir dans le navigateur</Text>
              <Ionicons name="globe-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
            
            {document.file_path && (
              <TouchableOpacity 
                className="flex-row items-center p-3 bg-blue-50 rounded-lg"
                onPress={viewDocument}
              >
                <MaterialIcons name="insert-drive-file" size={24} color="#3b82f6" />
                <Text className="ml-3 flex-1 text-blue-800">Consulter le document</Text>
                <Ionicons name="open-outline" size={20} color="#3b82f6" />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Fichier associé pour les autres types de documents */}
        {document.file_path && document.type !== 'photo_chantier' && document.type !== 'devis' && (
          <View className="bg-white p-5 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Fichier associé</Text>
            <TouchableOpacity 
              className="flex-row items-center p-3 bg-blue-50 rounded-lg"
              onPress={viewDocument}
            >
              <MaterialIcons name="insert-drive-file" size={24} color="#3b82f6" />
              <Text className="ml-3 flex-1 text-blue-800">Consulter le document</Text>
              <Ionicons name="open-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        )}

        {/* Espace supplémentaire pour permettre le défilement */}
        <View style={{ height: 120 }} />
      </View>
    );
  };
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: document ? `${document.reference}` : 'Document',
          headerRight: () => (
            <TouchableOpacity onPress={shareDocument} className="mr-4">
              <Ionicons name="share-outline" size={24} color="#3b82f6" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView 
        className="bg-gray-50" 
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={true}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
