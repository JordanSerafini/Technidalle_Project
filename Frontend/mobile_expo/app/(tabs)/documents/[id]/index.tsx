import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image, Dimensions, Share, Alert, Linking, SafeAreaView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useDocumentDetails, DocumentLine } from '@/app/hooks/useDocumentDetails';
import { DocumentStatus, DocumentType } from '@/app/utils/interfaces/document';
import { formatDate } from '@/app/utils/dateFormatter';
import { url as urlConfig } from '@/app/utils/url';
import * as WebBrowser from 'expo-web-browser';
import { formatTextForDisplay } from '@/app/utils/textUtils';

export default function DocumentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [imageExpanded, setImageExpanded] = useState(false);
  
  // Récupérer les détails complets du document avec lignes
  const { document, loading, error } = useDocumentDetails(id);
  
  // Dimensions de l'écran pour l'affichage des images
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  
  // Fonction pour partager le document
  const shareDocument = async () => {
    if (!document) return;
    
    try {
      await Share.share({
        title: `Document: ${document.reference}`,
        message: `Référence: ${document.reference}\nType: ${document.type}\nDate: ${formatDate(document.issue_date)}\nMontant: ${document.total_ttc?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || 'N/A'}`,
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
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'valide': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'refuse': return 'bg-red-100 text-red-800';
      case 'annule': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };
  
  // Fonction pour obtenir l'icône en fonction du type de document
  const getDocumentIcon = (type: string) => {
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

  // Composant pour afficher une ligne de document
  const DocumentLineItem = ({ line, index }: { line: DocumentLine; index: number }) => {
    const lineTotal = line.total_ht || (line.quantity * line.unit_price - line.discount_amount);
    
    return (
      <View className="bg-gray-50 p-4 rounded-lg mb-3">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="font-semibold text-gray-800 flex-1 mr-2">
            {line.material?.name || line.description}
          </Text>
          <Text className="font-bold text-gray-900">
            {lineTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </Text>
        </View>
        
        {line.material?.name && line.description !== line.material.name && (
          <Text className="text-gray-600 text-sm mb-2">{line.description}</Text>
        )}
        
        <View className="flex-row flex-wrap gap-2 mb-2">
          <View className="bg-blue-100 px-2 py-1 rounded">
            <Text className="text-blue-800 text-xs">
              Qté: {line.quantity} {line.unit}
            </Text>
          </View>
          <View className="bg-blue-100 px-2 py-1 rounded">
            <Text className="text-blue-800 text-xs">
              P.U.: {line.unit_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </Text>
          </View>
          {line.discount_percent > 0 && (
            <View className="bg-orange-100 px-2 py-1 rounded">
              <Text className="text-orange-800 text-xs">
                Remise: {line.discount_percent}%
              </Text>
            </View>
          )}
          <View className="bg-green-100 px-2 py-1 rounded">
            <Text className="text-green-800 text-xs">
              TVA: {line.tax_rate}%
            </Text>
          </View>
        </View>
        
        {line.material?.reference && (
          <Text className="text-gray-500 text-xs">Réf: {line.material.reference}</Text>
        )}
      </View>
    );
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

        {/* Informations client */}
        {document.client && (
          <View className="bg-white p-5 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Client</Text>
            
            <View className="mb-2">
              <Text className="text-gray-800 font-medium">
                {document.client.company_name || `${document.client.firstname} ${document.client.lastname}`}
              </Text>
              {document.client.company_name && (
                <Text className="text-gray-600">
                  {document.client.firstname} {document.client.lastname}
                </Text>
              )}
            </View>
            
            <View className="mb-2">
              <Text className="text-gray-600">{document.client.email}</Text>
            </View>
            
            {(document.client.phone || document.client.mobile) && (
              <View className="mb-2">
                <Text className="text-gray-600">
                  {document.client.phone || document.client.mobile}
                </Text>
              </View>
            )}
            
            {document.client.siret && (
              <View className="mb-2">
                <Text className="text-gray-500">SIRET: {document.client.siret}</Text>
              </View>
            )}
          </View>
        )}

        {/* Informations projet */}
        {document.project && (
          <View className="bg-white p-5 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Projet</Text>
            
            <View className="mb-2">
              <Text className="text-gray-800 font-medium">{document.project.name}</Text>
              <Text className="text-gray-600">{document.project.reference}</Text>
            </View>
            
            {document.project.description && (
              <View className="mb-2">
                <Text className="text-gray-600">
                  {formatTextForDisplay(document.project.description, 150)}
                </Text>
              </View>
            )}
            
            <View className="flex-row flex-wrap gap-2">
              <View className="bg-blue-100 px-2 py-1 rounded">
                <Text className="text-blue-800 text-xs">
                  Statut: {document.project.status}
                </Text>
              </View>
              {document.project.budget && (
                <View className="bg-green-100 px-2 py-1 rounded">
                  <Text className="text-green-800 text-xs">
                    Budget: {document.project.budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Informations générales du document */}
        <View className="bg-white p-5 rounded-lg shadow-sm mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Informations générales</Text>
          
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
          
          {document.validity_period && (
            <View className="mb-3">
              <Text className="text-gray-500">Période de validité</Text>
              <Text className="text-gray-800 font-medium">{document.validity_period} jours</Text>
            </View>
          )}
          
          {document.payment_terms && (
            <View className="mb-3">
              <Text className="text-gray-500">Conditions de paiement</Text>
              <Text className="text-gray-800 font-medium">{document.payment_terms}</Text>
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

        {/* Lignes du document */}
        {document.lines && document.lines.length > 0 && (
          <View className="bg-white p-5 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Détail des prestations ({document.lines.length} ligne{document.lines.length > 1 ? 's' : ''})
            </Text>
            
            {document.lines.map((line, index) => (
              <DocumentLineItem key={line.id} line={line} index={index} />
            ))}
          </View>
        )}

        {/* Récapitulatif financier */}
        <View className="bg-white p-5 rounded-lg shadow-sm mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Récapitulatif financier</Text>
          
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Sous-total HT</Text>
              <Text className="text-gray-800 font-medium">
                {document.subtotal_ht?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || 'N/A'}
              </Text>
            </View>
            
            {document.discount_rate > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Remise ({document.discount_rate}%)</Text>
                <Text className="text-orange-600 font-medium">
                  -{document.total_discount?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                </Text>
              </View>
            )}
            
            {document.shipping_costs > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Frais de livraison</Text>
                <Text className="text-gray-800 font-medium">
                  {document.shipping_costs.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </Text>
              </View>
            )}
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">TVA ({document.tva_rate}%)</Text>
              <Text className="text-gray-800 font-medium">
                {document.total_tax?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || 'N/A'}
              </Text>
            </View>
            
            <View className="border-t border-gray-200 pt-2 mt-2">
              <View className="flex-row justify-between">
                <Text className="text-lg font-bold text-gray-800">Total TTC</Text>
                <Text className="text-lg font-bold text-gray-800">
                  {document.total_ttc?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || 
                   document.amount?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Informations de paiement */}
            {(document.amount_paid > 0 || document.balance_due) && (
              <>
                <View className="border-t border-gray-200 pt-2 mt-2">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Montant payé</Text>
                    <Text className="text-green-600 font-medium">
                      {document.amount_paid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </Text>
                  </View>
                  
                  {document.balance_due && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Solde restant</Text>
                      <Text className="text-red-600 font-medium">
                        {document.balance_due.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
        
        {/* Notes */}
        {document.notes && (
          <View className="bg-white p-5 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Notes</Text>
            <Text className="text-gray-700">{document.notes}</Text>
          </View>
        )}

        {/* Mentions légales */}
        {document.legal_mentions && (
          <View className="bg-white p-5 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Mentions légales</Text>
            <Text className="text-gray-700 text-sm">{document.legal_mentions}</Text>
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

        {/* Informations de signature */}
        {document.signed_by_client && (
          <View className="bg-green-50 p-5 rounded-lg shadow-sm mb-4 border border-green-200">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
              <Text className="ml-2 text-lg font-semibold text-green-800">Document signé</Text>
            </View>
            {document.signed_date && (
              <Text className="text-green-700">
                Signé le {formatDate(document.signed_date)}
              </Text>
            )}
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
