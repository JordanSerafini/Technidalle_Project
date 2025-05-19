import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type OverviewCardProps = {
  overview: string;
};

export const OverviewCard = ({ overview }: OverviewCardProps) => {
  // Fonction pour formater le texte en sections
  const formatOverview = (text: string) => {
    const sections = text.split('\n\n').filter(Boolean);
    
    return sections.map((section, index) => {
      // Détecter si c'est un titre de section
      if (section.endsWith(':') || section.includes('prioritaires:') || section.includes('requises:')) {
        return (
          <View key={index} className="mb-3">
            <Text className="text-base font-semibold text-blue-900 mb-2">{section}</Text>
          </View>
        );
      }
      
      // Pour les listes numérotées ou avec puces
      const lines = section.split('\n').filter(Boolean);
      return (
        <View key={index} className="mb-3">
          {lines.map((line, lineIndex) => {
            // Vérifier si c'est un élément numéroté ou avec une puce
            const isNumbered = /^\d+\./.test(line);
            const isBullet = /^-/.test(line);
            
            if (isNumbered || isBullet) {
              return (
                <View key={lineIndex} className="pl-2 mb-1.5">
                  <Text className="text-sm text-gray-700 leading-5">{line}</Text>
                </View>
              );
            }
            
            // Texte normal
            return <Text key={lineIndex} className="text-sm text-gray-700 mb-1.5 leading-5">{line}</Text>;
          })}
        </View>
      );
    });
  };

  return (
    <View className="mb-4 bg-blue-50 rounded-xl shadow-sm overflow-hidden">
      <View className="flex-row items-center bg-blue-100 p-4 rounded-t-xl border-b border-blue-200">
        <Ionicons name="document-text-outline" size={22} color="#2563eb" />
        <Text className="text-lg font-bold text-blue-800 ml-2.5">Résumé journalier </Text>
      </View>
      <View className="p-4">
        {formatOverview(overview)}
      </View>
    </View>
  );
};

export default OverviewCard; 