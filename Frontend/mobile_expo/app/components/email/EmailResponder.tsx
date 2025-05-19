import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmailData, ResponseLength } from '../../utils/types/mailTypes';
import mailFunctions from '../../utils/functions/mails.function';
import url from '@/app/utils/url';
// Import du store
import { useMailsStore } from '../../store/mailsStore';

// Constantes pour l'API (locales)
const API_URL = url.email;

// Options fetch de base
const fetchOptions = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Origin': Platform.OS === 'web' ? 'http://localhost:8081' : 'http://localhost'
  },
  mode: 'cors' as RequestMode,
  credentials: 'include' as RequestCredentials
};

// Destructuring des fonctions depuis l'objet importé
const { 
  fetchEmailsRequiringResponse, 
  fetchDraftResponse, 
  fetchRewrittenResponse,
  sendEmailResponse,
  sendAutoResponse,
  setDataMode,
  getDataMode
} = mailFunctions;

interface EmailResponderProps {
  onClose?: () => void;
  selectedEmailId?: string;
}

export default function EmailResponder({ onClose, selectedEmailId }: EmailResponderProps) {
  // Utilisation du store pour le chargement
  const { isLoading, actionRequiredEmails } = useMailsStore();
  
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [emailsList, setEmailsList] = useState<EmailData[]>([]);
  const [response, setResponse] = useState('');
  const [subject, setSubject] = useState('');
  const [instructions, setInstructions] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(selectedEmailId || null);
  const [activeView, setActiveView] = useState<'list' | 'compose'>(selectedEmailId ? 'compose' : 'list');
  
  // Nouvelles propriétés pour les fonctionnalités demandées
  const [responseLength, setResponseLength] = useState<ResponseLength>('normal');
  const [fastMode, setFastMode] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSearchOptions, setShowSearchOptions] = useState(true);
  const [useMockData, setUseMockData] = useState(getDataMode()); // Nouvel état pour le mode de données
  const [forceRefresh, setForceRefresh] = useState(false); // Nouvel état pour forcer le rafraîchissement
  const initialRenderDone = useRef(false);

  // Effet pour suivre les emails depuis le store
  useEffect(() => {
    if (actionRequiredEmails.length > 0) {
      setEmailsList(actionRequiredEmails);
      setHasSearched(true);
    }
  }, [actionRequiredEmails]);

  // Fonction pour basculer entre les modes de données (mock/API)
  const toggleDataMode = useCallback(() => {
    const newMode = !useMockData;
    setUseMockData(newMode);
    setDataMode(newMode);
  }, [useMockData]);

  // Fonction pour basculer le forceRefresh
  const toggleForceRefresh = useCallback(() => {
    setForceRefresh(prev => !prev);
  }, []);

  const processSelectedEmail = useCallback((emailId: string) => {
    if (emailId) {
      setSelectedEmail(emailId);
      generateDraft(emailId);
    }
  }, []);  

  useEffect(() => {
    // Empêcher toute action automatique au premier rendu
    if (!initialRenderDone.current) {
      initialRenderDone.current = true;
      return;
    }

    // Ne traiter l'email sélectionné que s'il vient d'une prop explicite
    if (selectedEmailId) {
      processSelectedEmail(selectedEmailId);
    }
  }, [selectedEmailId, processSelectedEmail]);

  const loadEmailsRequiringResponse = async () => {
    try {
      // Récupérer le store
      const store = useMailsStore.getState();
      
      // Vérifier si des emails sont déjà dans le store
      if (store.actionRequiredEmails.length > 0 && !forceRefresh) {
        console.log('[STORE] Utilisation des emails déjà en cache');
        setEmailsList(store.actionRequiredEmails);
        setHasSearched(true);
        return;
      }
      
      // Si on arrive ici, c'est qu'on doit charger les emails (première fois ou forceRefresh)
      // Plus besoin de gérer le loading manuellement, le store le fait
      const emails = await fetchEmailsRequiringResponse(fastMode, forceRefresh);
      
      // Si le store ne met pas à jour automatiquement
      if (!emails || emails.length === 0) {
        setEmailsList([]);
      }
      
      setHasSearched(true);
    } catch (err) {
      console.error('Erreur lors du chargement des emails:', err);
    }
  };

  const generateDraft = async (emailId: string) => {
    try {
      // Vérifier d'abord si un brouillon existe déjà dans le cache
      const store = useMailsStore.getState();
      const cachedDraft = store.getDraftResponse(emailId, responseLength);
      
      if (cachedDraft && !forceRefresh) {
        console.log('[STORE] Utilisation du brouillon depuis le cache');
        setEmailData(cachedDraft.originalEmail);
        setResponse(cachedDraft.draftResponse);
        setActiveView('compose');
        return; // Important: sortir de la fonction pour éviter le fetch
      }
      
      console.log(`[API] Génération d'un brouillon pour l'email ${emailId} - forceRefresh:`, forceRefresh);
      
      // Important: activer uniquement le loading local, pas celui du store
      setLoading(true);
      
      // Créer un objet temporaire pour récupérer la réponse sans utiliser setIsLoading du store
      let result;
      
      if (useMockData) {
        // Utiliser la méthode mockée directement ici pour éviter l'appel au store global
        console.log(`[MOCK] Génération directe du brouillon (emailId: ${emailId})`);
        
        // Simuler un délai
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Trouver l'email original dans les données du store
        const originalEmail = store.actionRequiredEmails.find(email => email.id === emailId) || null;
        
        if (!originalEmail) {
          throw new Error(`Email avec l'ID ${emailId} non trouvé`);
        }
        
        // Générer un brouillon de réponse
        let draftResponse = '';
        const fromName = originalEmail.from.match(/"([^"]+)"/) 
          ? originalEmail.from.match(/"([^"]+)"/)![1] 
          : originalEmail.from.split('<')[0].trim();
          
        switch (responseLength) {
          case 'court':
            draftResponse = `Bonjour ${fromName},\n\nMerci pour votre message. J'ai bien pris note de votre demande.\n\nCordialement,\nJordan`;
            break;
          case 'détaillé':
            draftResponse = `Bonjour ${fromName},\n\nJe vous remercie pour votre message concernant "${originalEmail.subject}".\n\nJ'ai bien pris note de tous les éléments que vous avez partagés. Après analyse, je souhaite vous informer que nous allons traiter cette demande avec la plus grande attention.\n\nÀ propos des points que vous avez soulevés:\n1. Nous avons bien compris votre préoccupation principale\n2. Les actions suggérées seront mises en œuvre prochainement\n3. Un suivi sera effectué dans les meilleurs délais\n\nN'hésitez pas à me contacter si vous avez besoin d'informations supplémentaires.\n\nCordialement,\nJordan Serafini`;
            break;
          default: // 'normal'
            draftResponse = `Bonjour ${fromName},\n\nMerci pour votre message concernant "${originalEmail.subject}".\n\nJ'ai bien pris note de votre demande et je m'en occupe dans les plus brefs délais. Soyez assuré(e) que nous apportons à ce sujet toute l'attention qu'il mérite.\n\nCordialement,\nJordan`;
        }
        
        result = {
          originalEmail,
          draftResponse
        };
        
        // Stocker dans le cache
        store.setDraftResponse(emailId, result, responseLength);
      } else {
        // Ne pas passer par fetchDraftResponse directement qui appelle setIsLoading
        // Recréer la même logique ici mais sans appeler setIsLoading
        const email = store.actionRequiredEmails.find(email => email.id === emailId);
        const imapUID = email?.imapUID || emailId;
        
        const apiResponse = await fetch(
          `${API_URL}/send-email/draft-response/${imapUID}?responseLength=${responseLength}`,
          { ...fetchOptions, method: 'GET' }
        );
        
        const data = await apiResponse.json();
        
        if (data.status === 'success') {
          result = {
            originalEmail: data.data.originalEmail || null,
            draftResponse: data.data.draftResponse || ''
          };
          
          // Stocker dans le cache
          store.setDraftResponse(emailId, result, responseLength);
        } else {
          throw new Error(data.message);
        }
      }
      
      if (result && result.originalEmail) {
        setEmailData(result.originalEmail);
        setResponse(result.draftResponse);
        setActiveView('compose');
      }
    } catch (err) {
      console.error('Erreur lors de la génération du brouillon:', err);
    } finally {
      setLoading(false);
    }
  };

  const rewriteResponse = async () => {
    if (!instructions.trim() || !selectedEmail) return;

    try {
      // Utiliser le forceRefresh
      const newResponse = await fetchRewrittenResponse(
        selectedEmail,
        response,
        instructions,
        responseLength,
        forceRefresh
      );
      
      setResponse(newResponse);
      setInstructions('');
      setEditMode(false);
    } catch (err) {
      console.error('Erreur lors de la reformulation:', err);
    }
  };

  const handleSendResponse = async () => {
    if (!response.trim() || !selectedEmail) return;

    try {
      // Le loading est géré par le store
      const success = await sendEmailResponse(
        selectedEmail,
        response,
        subject || undefined
      );
      
      if (success) {
        // Après un envoi réussi, supprimer l'email du store local
        const store = useMailsStore.getState();
        const updatedEmails = store.actionRequiredEmails.filter(
          email => email.id !== selectedEmail && email.imapUID !== selectedEmail
        );
        store.setActionRequiredEmails(updatedEmails);
        
        // Mise à jour de la liste locale sans appel API
        setEmailsList(updatedEmails);
        
        resetForm();
        setActiveView('list');
        // Ne pas rafraîchir la liste après envoi - utiliser le store à la place
        // loadEmailsRequiringResponse(); 
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi:', err);
    }
  };

  const handleAutoRespond = async () => {
    if (!selectedEmail) return;

    try {
      // Le loading est géré par le store
      const success = await sendAutoResponse(
        selectedEmail,
        responseLength,
        instructions.trim() || undefined,
        subject || undefined
      );
      
      if (success) {
        // Après un envoi réussi, supprimer l'email du store local
        const store = useMailsStore.getState();
        const updatedEmails = store.actionRequiredEmails.filter(
          email => email.id !== selectedEmail && email.imapUID !== selectedEmail
        );
        store.setActionRequiredEmails(updatedEmails);
        
        // Mise à jour de la liste locale sans appel API
        setEmailsList(updatedEmails);
        
        resetForm();
        setActiveView('list');
        // Ne pas rafraîchir la liste après envoi - utiliser le store à la place
        // loadEmailsRequiringResponse();
      }
    } catch (err) {
      console.error('Erreur lors de la réponse automatique:', err);
    }
  };

  const resetForm = () => {
    setResponse('');
    setSubject('');
    setInstructions('');
    setEmailData(null);
    setSelectedEmail(null);
    setEditMode(false);
    setHasSearched(false);
  };

  const toggleFastMode = () => {
    setFastMode(prevMode => !prevMode);
  };

  const renderEmailItem = (email: EmailData) => {
    return (
      <TouchableOpacity 
        key={email.id} 
        className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100"
        onPress={() => {
          setSelectedEmail(email.id);
          generateDraft(email.id);
        }}
      >
        <Text className="text-lg font-semibold text-blue-800 mb-1">{email.subject}</Text>
        <Text className="text-sm text-gray-600 mb-1">De: {email.from}</Text>
        <Text className="text-sm text-gray-500 mb-2" numberOfLines={2}>{email.analysis?.summary}</Text>
        
        <View className="flex-row mt-1">
          <View className={`px-2 py-1 rounded-full mr-2 ${
            email.analysis?.priority === 'high' ? 'bg-red-100' : 
            email.analysis?.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
          }`}>
            <Text className={`text-xs ${
              email.analysis?.priority === 'high' ? 'text-red-800' : 
              email.analysis?.priority === 'medium' ? 'text-yellow-800' : 'text-green-800'
            }`}>
              {email.analysis?.priority === 'high' ? 'Prioritaire' : 
               email.analysis?.priority === 'medium' ? 'Moyen' : 'Faible'}
            </Text>
          </View>
          
          <View className="px-2 py-1 rounded-full bg-blue-100 mr-2">
            <Text className="text-xs text-blue-800">{email.analysis?.category}</Text>
          </View>

          {email.analysis.performanceMetrics && (
            <View className="px-2 py-1 rounded-full bg-purple-100">
              <Text className="text-xs text-purple-800">
                {Math.round(email.analysis.performanceMetrics.totalLatencyMs / 100) / 10}s
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderResponseLengthSelector = () => {
    return (
      <View className="flex-row justify-between mb-4 p-2 bg-gray-50 rounded-lg">
        <TouchableOpacity
          className={`flex-1 p-2 rounded-lg mr-2 ${responseLength === 'court' ? 'bg-blue-500' : 'bg-gray-200'}`}
          onPress={() => setResponseLength('court')}
        >
          <Text className={`text-center font-medium ${responseLength === 'court' ? 'text-white' : 'text-gray-800'}`}>
            Court
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`flex-1 p-2 rounded-lg mr-2 ${responseLength === 'normal' ? 'bg-blue-500' : 'bg-gray-200'}`}
          onPress={() => setResponseLength('normal')}
        >
          <Text className={`text-center font-medium ${responseLength === 'normal' ? 'text-white' : 'text-gray-800'}`}>
            Normal
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`flex-1 p-2 rounded-lg ${responseLength === 'détaillé' ? 'bg-blue-500' : 'bg-gray-200'}`}
          onPress={() => setResponseLength('détaillé')}
        >
          <Text className={`text-center font-medium ${responseLength === 'détaillé' ? 'text-white' : 'text-gray-800'}`}>
            Détaillé
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSearchOptions = () => {
    return (
      <View className="mb-6 bg-white rounded-lg p-4 shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold text-gray-800">Options de recherche</Text>
          
          <TouchableOpacity 
            className="p-2" 
            onPress={() => setShowSearchOptions(!showSearchOptions)}
          >
            <Ionicons 
              name={showSearchOptions ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#4b5563" 
            />
          </TouchableOpacity>
        </View>
        
        {showSearchOptions && (
          <>
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Text className="text-gray-700 mr-2">Utiliser les données mockées</Text>
                <TouchableOpacity 
                  onPress={() => Alert.alert(
                    "Mode de données",
                    "Choisissez entre les données mockées (mode hors ligne) ou l'API réelle (mode en ligne)."
                  )}
                >
                  <Ionicons name="information-circle-outline" size={16} color="#4b5563" />
                </TouchableOpacity>
              </View>
              <Switch
                value={useMockData}
                onValueChange={toggleDataMode}
                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                thumbColor={useMockData ? "#3b82f6" : "#f4f4f5"}
              />
            </View>
            
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-700">Mode rapide</Text>
              <Switch
                value={fastMode}
                onValueChange={toggleFastMode}
                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                thumbColor={fastMode ? "#3b82f6" : "#f4f4f5"}
              />
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Text className="text-gray-700 mr-2">Forcer rafraîchissement</Text>
                <TouchableOpacity 
                  onPress={() => Alert.alert(
                    "Forcer le rafraîchissement",
                    "Si activé, les emails seront toujours rechargés depuis l'API. Sinon, les données en cache seront utilisées si disponibles."
                  )}
                >
                  <Ionicons name="information-circle-outline" size={16} color="#4b5563" />
                </TouchableOpacity>
              </View>
              <Switch
                value={forceRefresh}
                onValueChange={toggleForceRefresh}
                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                thumbColor={forceRefresh ? "#3b82f6" : "#f4f4f5"}
              />
            </View>
            
            <Text className="text-gray-700 mb-2">Longueur des réponses</Text>
            {renderResponseLengthSelector()}
            
            <TouchableOpacity
              className="mt-2 bg-blue-500 rounded-lg p-3 w-full"
              onPress={loadEmailsRequiringResponse}
              disabled={isLoading}
            >
              <Text className="text-white text-center font-medium">
                {isLoading ? "Chargement..." : forceRefresh ? "Recharger les emails" : "Rechercher les emails"}
              </Text>
            </TouchableOpacity>
            
            {actionRequiredEmails.length > 0 && !forceRefresh && (
              <Text className="text-center text-xs text-gray-500 mt-2">
                {actionRequiredEmails.length} emails déjà en cache. Activez "Forcer le rafraîchissement" pour recharger.
              </Text>
            )}
          </>
        )}
      </View>
    );
  };

  const renderEmailList = () => {
    return (
      <View className="flex-1">
        {renderSearchOptions()}
        
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-600 mt-4">Chargement des emails...</Text>
          </View>
        ) : (
          <>
            {hasSearched && (
              <View className="mb-4">
                {emailsList.length > 0 ? (
                  <Text className="text-gray-700 mb-2">
                    {emailsList.length} {emailsList.length === 1 ? 'email nécessite' : 'emails nécessitent'} une réponse
                  </Text>
                ) : (
                  <View className="p-4 bg-gray-100 rounded-lg">
                    <Text className="text-gray-600 text-center">Aucun email nécessitant une réponse</Text>
                  </View>
                )}
              </View>
            )}
            
            {emailsList.map(renderEmailItem)}
          </>
        )}
      </View>
    );
  };

  const renderComposeView = () => {
    return (
      <View className="flex-1">
        {emailData ? (
          <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <Text className="text-lg font-semibold text-blue-800 mb-1">{emailData.subject}</Text>
            <Text className="text-sm text-gray-600 mb-1">De: {emailData.from}</Text>
            <Text className="text-sm text-gray-500 mb-2">{emailData.analysis?.summary}</Text>
          </View>
        ) : null}
        
        <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <TextInput
            className="p-2 bg-gray-50 rounded-lg mb-4"
            placeholder="Sujet (optionnel)"
            value={subject}
            onChangeText={setSubject}
          />
          
          <TextInput
            className="p-3 bg-gray-50 rounded-lg mb-4 min-h-[150px]"
            placeholder="Votre réponse..."
            multiline
            textAlignVertical="top"
            value={response}
            onChangeText={setResponse}
            editable={!isLoading}
          />
          
          {editMode ? (
            <>
              <TextInput
                className="p-3 bg-gray-50 rounded-lg mb-4"
                placeholder="Instructions pour reformuler (ex: plus formel, plus concis...)"
                value={instructions}
                onChangeText={setInstructions}
                editable={!isLoading}
              />
              
              <View className="flex-row justify-end mb-2">
                <TouchableOpacity
                  className="mr-3 p-2"
                  onPress={() => setEditMode(false)}
                  disabled={isLoading}
                >
                  <Text className="text-gray-600">Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="bg-blue-500 px-4 py-2 rounded-lg"
                  onPress={rewriteResponse}
                  disabled={isLoading || !instructions.trim()}
                >
                  <Text className="text-white">Reformuler</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              className="flex-row items-center justify-center bg-gray-100 p-2 rounded-lg mb-4"
              onPress={() => setEditMode(true)}
              disabled={isLoading}
            >
              <Ionicons name="create-outline" size={18} color="#4b5563" />
              <Text className="ml-2 text-gray-700">Reformuler cette réponse</Text>
            </TouchableOpacity>
          )}
          
          <View className="flex-row">
            <TouchableOpacity
              className="flex-1 mr-2 bg-green-500 p-3 rounded-lg flex-row justify-center items-center"
              onPress={handleSendResponse}
              disabled={isLoading || !response.trim()}
            >
              <Ionicons name="send" size={18} color="white" />
              <Text className="text-white ml-2">Envoyer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 bg-blue-500 p-3 rounded-lg flex-row justify-center items-center"
              onPress={handleAutoRespond}
              disabled={isLoading}
            >
              <Ionicons name="flash" size={18} color="white" />
              <Text className="text-white ml-2">Auto-répondre</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity
          className="bg-gray-200 p-3 rounded-lg flex-row justify-center items-center"
          onPress={() => {
            resetForm();
            setActiveView('list');
          }}
          disabled={isLoading}
        >
          <Ionicons name="arrow-back" size={18} color="#4b5563" />
          <Text className="text-gray-700 ml-2">Retour à la liste</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 p-4 bg-gray-50">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold text-gray-800">
          {activeView === 'list' ? 'Emails à traiter' : 'Composer une réponse'}
        </Text>
        
        {onClose && (
          <TouchableOpacity className="p-2" onPress={onClose}>
            <Ionicons name="close" size={24} color="#4b5563" />
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {activeView === 'list' ? renderEmailList() : renderComposeView()}
      </ScrollView>
    </View>
  );
} 