import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
          <View key={index} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section}</Text>
          </View>
        );
      }
      
      // Pour les listes numérotées ou avec puces
      const lines = section.split('\n').filter(Boolean);
      return (
        <View key={index} style={styles.sectionContainer}>
          {lines.map((line, lineIndex) => {
            // Vérifier si c'est un élément numéroté ou avec une puce
            const isNumbered = /^\d+\./.test(line);
            const isBullet = /^-/.test(line);
            
            if (isNumbered || isBullet) {
              return (
                <View key={lineIndex} style={styles.listItemContainer}>
                  <Text style={styles.listItemText}>{line}</Text>
                </View>
              );
            }
            
            // Texte normal
            return <Text key={lineIndex} style={styles.normalText}>{line}</Text>;
          })}
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Ionicons name="document-text-outline" size={22} color="#2563eb" />
        <Text style={styles.headerTitle}>Aperçu général</Text>
      </View>
      <View style={styles.contentContainer}>
        {formatOverview(overview)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginLeft: 10,
  },
  contentContainer: {
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  listItemContainer: {
    flexDirection: 'row',
    paddingLeft: 8,
    marginBottom: 6,
  },
  listItemText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  normalText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 20,
  }
});

export default OverviewCard; 