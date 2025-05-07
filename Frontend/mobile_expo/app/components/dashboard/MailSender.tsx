import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmailData } from '../../utils/types/mailTypes';
import { 
  fetchEmailsRequiringResponse, 
  fetchDraftResponse, 
  fetchRewrittenResponse,
  sendEmailResponse,
  sendAutoResponse
} from '../../utils/functions/mails.function';

interface MailSenderProps {
  onClose?: () => void;
  selectedEmailId?: string;
}

export default function MailSender({ onClose, selectedEmailId }: MailSenderProps) {
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [emailsList, setEmailsList] = useState<EmailData[]>([]);
  const [response, setResponse] = useState('');
  const [subject, setSubject] = useState('');
  const [instructions, setInstructions] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(selectedEmailId || null);
  const [activeView, setActiveView] = useState<'list' | 'compose'>(selectedEmailId ? 'compose' : 'list');

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
      const emails = await fetchEmailsRequiringResponse();
      setEmailsList(emails);
    } catch (err) {
      console.error('Erreur lors du chargement des emails:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateDraft = async (emailId: string) => {
    try {
      setLoading(true);
      const result = await fetchDraftResponse(emailId);
      
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
          
          <View className="px-2 py-1 rounded-full bg-blue-100">
            <Text className="text-xs text-blue-800">{email.analysis?.category}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmailList = () => {
    return (
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-blue-800">Emails à traiter</Text>
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
        ) : (
          <ScrollView className="flex-1">
            {emailsList.length === 0 ? (
              <View className="p-4 bg-blue-50 rounded-lg items-center">
                <Text className="text-center text-blue-800">Aucun email nécessitant une réponse</Text>
              </View>
            ) : (
              emailsList.map(email => renderEmailItem(email))
            )}
          </ScrollView>
        )}
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
    <View className="flex-1 bg-green-100 border-t-2 border-blue-200">
      {activeView === 'list' ? renderEmailList() : renderComposeView()}
    </View>
  );
}
