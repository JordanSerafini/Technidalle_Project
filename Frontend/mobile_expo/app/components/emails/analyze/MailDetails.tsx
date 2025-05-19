import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmailData } from '../../../utils/types/mailTypes';
import { generateDraftResponse, sendEmailResponse } from '../../../utils/functions/emails/analyze-emails.function';

interface MailDetailsProps {
  visible: boolean;
  email: EmailData | null;
  onClose: () => void;
  onResponseSent?: () => void;
}

export default function MailDetails({ visible, email, onClose, onResponseSent }: MailDetailsProps) {
  const [responseText, setResponseText] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Extraire le nom de l'expéditeur
  const extractName = (fromString: string) => {
    return fromString.replace(/^"([^"]*)".*$/, '$1') || fromString;
  };
  
  // Générer un brouillon de réponse
  const handleGenerateResponse = async (length: 'court' | 'normal' | 'détaillé' = 'normal') => {
    if (!email) return;
    
    setLoadingResponse(true);
    setError(null);
    
    try {
      const result = await generateDraftResponse(email.id, email.folderPath, length);
      
      if (result.status === 'success' && result.data) {
        setResponseText(result.data.draftResponse);
        setCustomSubject(`Re: ${email.subject}`);
        setIsEditing(true);
      } else {
        setError(result.message || 'Erreur lors de la génération de la réponse');
      }
    } catch (err) {
      setError("Erreur lors de la génération de la réponse. Veuillez réessayer.");
      console.error(err);
    } finally {
      setLoadingResponse(false);
    }
  };
  
  // Envoyer la réponse
  const handleSendResponse = async () => {
    if (!email || !responseText) return;
    
    setLoadingSend(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await sendEmailResponse(
        email.id,
        responseText,
        customSubject || `Re: ${email.subject}`,
        email.folderPath
      );
      
      if (result.status === 'success') {
        setSuccess('Réponse envoyée avec succès!');
        setResponseText('');
        setCustomSubject('');
        setIsEditing(false);
        
        // Callback après envoi réussi
        if (onResponseSent) {
          setTimeout(() => {
            onResponseSent();
          }, 1500);
        }
      } else {
        setError(result.message || "Erreur lors de l'envoi de la réponse");
      }
    } catch (err) {
      setError("Erreur lors de l'envoi de la réponse. Veuillez réessayer.");
      console.error(err);
    } finally {
      setLoadingSend(false);
    }
  };
  
  // Réinitialiser le formulaire quand l'email change
  useEffect(() => {
    setResponseText('');
    setCustomSubject('');
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  }, [email]);

  if (!visible || !email) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View className="flex-1 bg-gray-50">
          {/* Header avec bouton retour */}
          <View className="bg-indigo-600 p-4 flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold flex-1 ml-2">Détails de l'email</Text>
          </View>
          
          {/* Contenu de l'email */}
          <ScrollView className="flex-1 p-4">
            {/* En-tête de l'email */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-xl font-bold text-gray-900 mb-2">{email.subject}</Text>
              
              <View className="flex-row items-center mb-3">
                <View className="h-10 w-10 bg-indigo-200 rounded-full items-center justify-center mr-3">
                  <Text className="text-indigo-700 font-bold">
                    {extractName(email.from).substring(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">{extractName(email.from)}</Text>
                  <Text className="text-gray-500 text-sm">{formatDate(email.date)}</Text>
                </View>
              </View>
              
              {email.analysis && (
                <View className="mb-3 p-2 bg-gray-50 rounded-lg">
                  {email.analysis.priority && (
                    <View className="flex-row items-center mb-1">
                      <Text className="text-gray-600 mr-2">Priorité:</Text>
                      <View className={`px-2 py-1 rounded-full ${
                        email.analysis.priority.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' :
                        email.analysis.priority.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        <Text className="text-xs font-medium">{email.analysis.priority}</Text>
                      </View>
                    </View>
                  )}
                  
                  {email.analysis.category && (
                    <View className="flex-row items-center mb-1">
                      <Text className="text-gray-600 mr-2">Catégorie:</Text>
                      <Text className="text-gray-800">{email.analysis.category}</Text>
                    </View>
                  )}
                  
                  {email.analysis.summary && (
                    <View className="mt-1">
                      <Text className="text-gray-600 mb-1">Résumé:</Text>
                      <Text className="text-gray-800 italic">{email.analysis.summary}</Text>
                    </View>
                  )}
                </View>
              )}
              
              {/* Corps de l'email */}
              <View className="bg-gray-50 p-3 rounded-lg">
                <Text className="text-gray-800">{email.body}</Text>
              </View>
              
              {/* Actions requises */}
              {email.analysis?.actionRequired && email.analysis.actionItems && email.analysis.actionItems.length > 0 && (
                <View className="mt-4">
                  <Text className="text-gray-700 font-medium mb-2">Actions requises:</Text>
                  {email.analysis.actionItems.map((item, index) => (
                    <View key={index} className="flex-row mb-1 items-start">
                      <View className="h-4 w-4 rounded-full bg-yellow-500 mr-2 mt-1" />
                      <Text className="text-gray-700 flex-1">{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            {/* Section de réponse */}
            {!isEditing ? (
              <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <Text className="text-lg font-bold text-indigo-900 mb-3">Répondre</Text>
                
                {error && (
                  <View className="bg-red-100 p-3 rounded-lg mb-3">
                    <Text className="text-red-800">{error}</Text>
                  </View>
                )}
                
                {success && (
                  <View className="bg-green-100 p-3 rounded-lg mb-3">
                    <Text className="text-green-800">{success}</Text>
                  </View>
                )}
                
                <View className="flex-row justify-around mb-2">
                  <TouchableOpacity 
                    onPress={() => handleGenerateResponse('court')}
                    className="bg-indigo-100 p-3 rounded-lg flex-1 mr-2 items-center"
                    disabled={loadingResponse}
                  >
                    <Text className="text-indigo-800">Réponse courte</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => handleGenerateResponse('normal')}
                    className="bg-indigo-500 p-3 rounded-lg flex-1 mr-2 items-center"
                    disabled={loadingResponse}
                  >
                    <Text className="text-white">Réponse normale</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => handleGenerateResponse('détaillé')}
                    className="bg-indigo-700 p-3 rounded-lg flex-1 items-center"
                    disabled={loadingResponse}
                  >
                    <Text className="text-white">Réponse détaillée</Text>
                  </TouchableOpacity>
                </View>
                
                {loadingResponse && (
                  <View className="items-center py-4">
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text className="text-indigo-800 mt-2">Génération en cours...</Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <Text className="text-lg font-bold text-indigo-900 mb-3">Répondre à cet email</Text>
                
                {error && (
                  <View className="bg-red-100 p-3 rounded-lg mb-3">
                    <Text className="text-red-800">{error}</Text>
                  </View>
                )}
                
                <View className="mb-3">
                  <Text className="text-gray-700 mb-1">Objet:</Text>
                  <TextInput
                    value={customSubject}
                    onChangeText={setCustomSubject}
                    className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                    placeholder="Objet de la réponse"
                  />
                </View>
                
                <View className="mb-3">
                  <Text className="text-gray-700 mb-1">Message:</Text>
                  <TextInput
                    value={responseText}
                    onChangeText={setResponseText}
                    className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                    placeholder="Votre réponse"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>
                
                <View className="flex-row justify-end">
                  <TouchableOpacity 
                    onPress={() => setIsEditing(false)}
                    className="bg-gray-200 p-3 rounded-lg mr-2"
                  >
                    <Text className="text-gray-800">Annuler</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={handleSendResponse}
                    className="bg-indigo-600 p-3 rounded-lg"
                    disabled={loadingSend || !responseText}
                  >
                    {loadingSend ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text className="text-white">Envoyer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
