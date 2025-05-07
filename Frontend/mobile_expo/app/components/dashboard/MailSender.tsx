import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmailData, ResponseLength } from '../../utils/types/mailTypes';
import mailFunctions from '../../utils/functions/mails.function';

// Destructuring des fonctions depuis l'objet importé
const { 
  fetchEmailsRequiringResponse, 
  fetchDraftResponse, 
  fetchRewrittenResponse,
  sendEmailResponse,
  sendAutoResponse
} = mailFunctions;

interface MailSenderProps {
  onClose?: () => void;
  selectedEmailId?: string;
  responseLength?: ResponseLength;
}

export default function MailSender({ onClose, selectedEmailId, responseLength: initialResponseLength }: MailSenderProps) {
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [emailsList, setEmailsList] = useState<EmailData[]>([]);
  const [response, setResponse] = useState('');
  const [subject, setSubject] = useState('');
  const [instructions, setInstructions] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(selectedEmailId || null);
  const [activeView, setActiveView] = useState<'list' | 'compose'>(selectedEmailId ? 'compose' : 'list');
  const [responseLength, setResponseLength] = useState<ResponseLength>(initialResponseLength || 'normal');
  // Nouvel état pour suivre les emails ouverts
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>({});
  // États pour contrôler l'affichage des sections
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const [showEmailsSection, setShowEmailsSection] = useState(false);
  const [showGeneralOverview, setShowGeneralOverview] = useState(true);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [fastMode, setFastMode] = useState(false);

  useEffect(() => {
    if (selectedEmailId) {
      setSelectedEmail(selectedEmailId);
      generateDraft(selectedEmailId);
    } else {
      loadEmailsRequiringResponse();
    }
  }, [selectedEmailId]);

  const loadEmailsRequiringResponse = async () => {
    try {
      setLoading(true);
      const emails = await fetchEmailsRequiringResponse(fastMode);
      setEmailsList(emails);
      // Réinitialiser tous les emails ouverts
      setExpandedEmails({});
    } catch (err) {
      console.error('Erreur lors du chargement des emails:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateDraft = async (emailId: string) => {
    try {
      setLoading(true);
      const result = await fetchDraftResponse(emailId, responseLength);
      
      if (result.originalEmail) {
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
      setLoading(true);
      const newResponse = await fetchRewrittenResponse(
        selectedEmail,
        response,
        instructions
      );
      
      setResponse(newResponse);
      setInstructions('');
      setEditMode(false);
    } catch (err) {
      console.error('Erreur lors de la reformulation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResponse = async () => {
    if (!response.trim() || !selectedEmail) return;

    try {
      setLoading(true);
      const success = await sendEmailResponse(
        selectedEmail,
        response,
        subject || undefined
      );
      
      if (success) {
        resetForm();
        loadEmailsRequiringResponse();
        setActiveView('list');
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoRespond = async () => {
    if (!selectedEmail) return;

    try {
      setLoading(true);
      const success = await sendAutoResponse(
        selectedEmail,
        responseLength,
        instructions.trim() || undefined,
        subject || undefined
      );
      
      if (success) {
        resetForm();
        loadEmailsRequiringResponse();
        setActiveView('list');
      }
    } catch (err) {
      console.error('Erreur lors de la réponse automatique:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResponse('');
    setSubject('');
    setInstructions('');
    setEmailData(null);
    setSelectedEmail(null);
    setEditMode(false);
  };

  // Fonction pour basculer l'état d'expansion d'un email
  const toggleEmailExpand = (emailId: string) => {
    setExpandedEmails(prev => ({
      ...prev,
      [emailId]: !prev[emailId]
    }));
  };

  // Rendu d'un header de section repliable
  const renderSectionHeader = (title: string, isExpanded: boolean, onToggle: () => void) => {
    return (
      <TouchableOpacity 
        className="flex-row justify-between items-center p-3 bg-blue-100 rounded-lg mb-3"
        onPress={onToggle}
      >
        <Text className="text-lg font-bold text-blue-800">{title}</Text>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#3b82f6" 
        />
      </TouchableOpacity>
    );
  };

  const renderEmailItem = (email: EmailData) => {
    // Vérifie si l'email est étendu ou non
    const isExpanded = expandedEmails[email.id] || false;
    
    return (
      <View key={email.id} className="mb-4 bg-white rounded-lg shadow-sm border border-gray-100">
        {/* En-tête de l'email (toujours visible) */}
        <TouchableOpacity 
          className="p-4"
          onPress={() => toggleEmailExpand(email.id)}
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold text-blue-800" numberOfLines={1}>{email.subject}</Text>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#3b82f6" 
            />
          </View>
          
          <Text className="text-sm text-gray-600">De: {email.from}</Text>
          
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
            
            <View className="px-2 py-1 rounded-full bg-blue-100">
              <Text className="text-xs text-blue-800">{email.analysis?.category}</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Contenu détaillé de l'email (visible seulement si étendu) */}
        {isExpanded && (
          <View className="p-4 pt-0 border-t border-gray-100">
            <Text className="text-sm text-gray-500 mb-3">{email.analysis?.summary}</Text>
            
            <TouchableOpacity 
              className="bg-blue-500 py-2 px-4 rounded-lg items-center"
              onPress={() => {
                setSelectedEmail(email.id);
                generateDraft(email.id);
              }}
            >
              <Text className="text-white font-medium">Répondre</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderGeneralOverview = () => {
    if (!showGeneralOverview) return null;
    
    return (
      <View className="mb-4 bg-white rounded-lg p-4 shadow-sm">
        <View className="flex-row justify-between">
          <View className="items-center flex-1 border-r border-gray-200">
            <Text className="text-2xl font-bold text-blue-800">{emailsList.length}</Text>
            <Text className="text-sm text-gray-600">Emails</Text>
          </View>
          
          <View className="items-center flex-1 border-r border-gray-200">
            <Text className="text-2xl font-bold text-yellow-600">
              {emailsList.filter(email => email.analysis?.priority === 'high').length}
            </Text>
            <Text className="text-sm text-gray-600">Prioritaires</Text>
          </View>
          
          <View className="items-center flex-1">
            <Text className="text-2xl font-bold text-green-600">
              {emailsList.filter(email => email.analysis?.actionRequired).length}
            </Text>
            <Text className="text-sm text-gray-600">Actions</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSearchOptions = () => {
    if (!showSearchOptions) return null;
    
    return (
      <View className="mb-4 bg-white rounded-lg p-4 shadow-sm">
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Mode rapide</Text>
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => setFastMode(!fastMode)}
              className={`w-12 h-6 rounded-full ${fastMode ? 'bg-blue-500' : 'bg-gray-300'} flex-row items-center px-1`}
            >
              <View className={`w-4 h-4 rounded-full bg-white ${fastMode ? 'ml-auto' : ''}`} />
            </TouchableOpacity>
            <Text className="ml-2 text-sm text-gray-600">
              {fastMode ? 'Activé' : 'Désactivé'}
            </Text>
          </View>
        </View>
        
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Longueur des réponses</Text>
          <View className="flex-row justify-between">
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
        </View>
        
        <TouchableOpacity 
          className="bg-blue-500 py-3 rounded-lg items-center"
          onPress={() => {
            loadEmailsRequiringResponse();
            setShowSearchOptions(false);
          }}
        >
          <Text className="text-white font-medium">Rechercher les emails</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmailList = () => {
    return (
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-blue-800">Technidalle Mail</Text>
          
          <View className="flex-row">
            <TouchableOpacity 
              onPress={() => setShowSearchOptions(!showSearchOptions)}
              className="p-2 mr-2"
            >
              <Ionicons name="search" size={24} color="#3b82f6" />
            </TouchableOpacity>
            
            {onClose && (
              <TouchableOpacity onPress={onClose} className="p-2">
                <Ionicons name="close" size={24} color="#3b82f6" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <ScrollView className="flex-1">
          {/* Section Options de recherche - seulement visible si showSearchOptions est true */}
          {showSearchOptions && (
            <>
              {renderSectionHeader("Options de recherche", true, () => {})}
              {renderSearchOptions()}
            </>
          )}
          
          {/* Section Aperçu général */}
          {renderSectionHeader("Aperçu général", showGeneralOverview, () => setShowGeneralOverview(!showGeneralOverview))}
          {renderGeneralOverview()}
          
          {/* Section Résumé de la journée */}
          {renderSectionHeader("Résumé de la journée", showDailySummary, () => setShowDailySummary(!showDailySummary))}
          {showDailySummary && (
            <View className="mb-4 bg-white rounded-lg p-4 shadow-sm">
              <Text className="text-gray-800">
                Bonjour, voici votre résumé d'emails du jour.
              </Text>
              <Text className="text-gray-800 mt-2">
                J'ai analysé un total de {emailsList.length} emails. Parmi eux, {emailsList.filter(email => email.analysis?.priority === 'high').length} sont prioritaires.
              </Text>
            </View>
          )}
          
          {/* Section Emails */}
          {renderSectionHeader("Emails", showEmailsSection, () => setShowEmailsSection(!showEmailsSection))}
          
          {showEmailsSection && (
            <>
              {loading ? (
                <View className="py-8 justify-center items-center">
                  <ActivityIndicator size="large" color="#3b82f6" />
                </View>
              ) : (
                <>
                  {emailsList.length === 0 ? (
                    <View className="p-4 bg-blue-50 rounded-lg items-center">
                      <Text className="text-center text-blue-800">Aucun email nécessitant une réponse</Text>
                    </View>
                  ) : (
                    emailsList.map(email => renderEmailItem(email))
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderComposeView = () => {
    return (
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity 
            onPress={() => {
              resetForm();
              setActiveView('list');
            }}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={20} color="#3b82f6" />
            <Text className="ml-1 text-blue-600">Retour</Text>
          </TouchableOpacity>
          
          {onClose && (
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#3b82f6" />
            </TouchableOpacity>
          )}
        </View>
        
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : !emailData ? (
          <TouchableOpacity 
            className="p-4 bg-blue-500 rounded-lg items-center"
            onPress={() => selectedEmail && generateDraft(selectedEmail)}
          >
            <Text className="text-white font-semibold">Générer un brouillon</Text>
          </TouchableOpacity>
        ) : (
          <ScrollView className="flex-1">
            <View className="p-4 bg-blue-50 rounded-lg mb-4">
              <Text className="text-lg font-semibold text-blue-800">{emailData.subject}</Text>
              <Text className="text-sm text-gray-600">De: {emailData.from}</Text>
            </View>
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Sujet (optionnel)</Text>
              <TextInput
                className="p-3 bg-white border border-gray-200 rounded-lg"
                placeholder="Laissez vide pour utiliser Re: sujet original"
                value={subject}
                onChangeText={setSubject}
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Longueur de réponse</Text>
              <View className="flex-row justify-between mb-2 p-2 bg-gray-50 rounded-lg">
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
            </View>
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Réponse</Text>
              <TextInput
                className="p-3 bg-white border border-gray-200 rounded-lg"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                value={response}
                onChangeText={setResponse}
                style={{ minHeight: 150 }}
              />
            </View>
            
            {editMode ? (
              <>
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Instructions pour reformuler</Text>
                  <TextInput
                    className="p-3 bg-white border border-gray-200 rounded-lg"
                    placeholder="Ex: Plus formel, plus concis, ton amical..."
                    value={instructions}
                    onChangeText={setInstructions}
                  />
                </View>
                
                <View className="flex-row justify-between mb-4">
                  <TouchableOpacity 
                    className="py-3 px-4 bg-gray-200 rounded-lg"
                    onPress={() => setEditMode(false)}
                  >
                    <Text className="text-gray-800">Annuler</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="py-3 px-4 bg-blue-500 rounded-lg"
                    onPress={rewriteResponse}
                    disabled={!instructions.trim() || loading}
                  >
                    <Text className="text-white font-semibold">
                      {loading ? 'Reformulation...' : 'Reformuler'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View className="flex-row justify-between mb-4">
                <TouchableOpacity 
                  className="py-3 px-4 bg-gray-200 rounded-lg"
                  onPress={() => setEditMode(true)}
                >
                  <Text className="text-gray-800">Modifier</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="py-3 px-4 bg-green-500 rounded-lg"
                  onPress={handleSendResponse}
                  disabled={!response.trim() || loading}
                >
                  <Text className="text-white font-semibold">
                    {loading ? 'Envoi...' : 'Envoyer'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">ou réponse automatique</Text>
              <TouchableOpacity 
                className="py-3 px-4 bg-blue-500 rounded-lg w-full items-center"
                onPress={handleAutoRespond}
                disabled={loading}
              >
                <Text className="text-white font-semibold">
                  {loading ? 'Traitement...' : 'Répondre automatiquement'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 border-t-2 border-blue-200">
      {activeView === 'list' ? renderEmailList() : renderComposeView()}
    </View>
  );
}
