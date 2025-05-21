import React, { useState } from 'react';
import { TouchableOpacity, Alert, Platform, TextInput, Modal, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SpeechButtonProps {
  onSpeechResult: (text: string) => void;
}

const SpeechButton: React.FC<SpeechButtonProps> = ({ onSpeechResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [dictatedText, setDictatedText] = useState('');

  const startSpeechRecognition = async () => {
    try {
      setIsListening(true);
      
      // Utilisation de l'API Web Speech si disponible (pour le web et certains appareils)
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        // @ts-ignore - L'API n'est pas dans les types TypeScript standards
        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          onSpeechResult(transcript);
          setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Erreur de reconnaissance vocale:', event.error);
          setIsListening(false);
          Alert.alert('Erreur', 'La reconnaissance vocale a rencontré un problème.');
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognition.start();
      } 
      // Pour les appareils mobiles (simuler avec une entrée manuelle)
      else {
        // Ouvrir la modal pour saisir le texte manuellement
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Erreur lors de la reconnaissance vocale:', error);
      setIsListening(false);
      Alert.alert('Non disponible', 'La reconnaissance vocale n\'est pas disponible sur cet appareil.');
    }
  };

  const handleConfirmDictation = () => {
    if (dictatedText.trim()) {
      onSpeechResult(dictatedText);
    }
    setDictatedText('');
    setModalVisible(false);
    setIsListening(false);
  };

  const handleCancelDictation = () => {
    setDictatedText('');
    setModalVisible(false);
    setIsListening(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={startSpeechRecognition}
        className="p-2 mr-1"
        disabled={isListening}
      >
        <Ionicons 
          name={isListening ? "mic" : "mic-outline"} 
          size={24} 
          color={isListening ? "#2563eb" : "#6b7280"} 
        />
      </TouchableOpacity>

      {/* Modal pour simulation d'entrée vocale */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancelDictation}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-xl p-4 w-80 shadow-lg">
            <Text className="text-lg font-bold mb-4 text-center">Simulation de dictée vocale</Text>
            <Text className="mb-2 text-gray-700">Saisissez ce que vous auriez dit :</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              value={dictatedText}
              onChangeText={setDictatedText}
              multiline
              placeholder="Texte dicté..."
              autoFocus
            />
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={handleCancelDictation}
                className="px-4 py-2 mr-2"
              >
                <Text className="text-gray-600">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDictation}
                className="px-4 py-2 bg-blue-500 rounded-lg"
              >
                <Text className="text-white font-medium">OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default SpeechButton; 