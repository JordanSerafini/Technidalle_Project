import React, { memo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { project_status } from '../../../utils/interfaces/project.interface';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const statusLabels: Record<project_status, string> = {
  prospect: 'Prospect',
  devis_en_cours: 'Devis en cours',
  devis_accepte: 'Devis accepté',
  en_preparation: 'En préparation',
  en_cours: 'En cours',
  en_pause: 'En pause',
  termine: 'Terminé',
  annule: 'Annulé'
};

const statusColors: Record<project_status, string> = {
  prospect: '#FFC107',
  devis_en_cours: '#FF9800',
  devis_accepte: '#4CAF50',
  en_preparation: '#2196F3',
  en_cours: '#3F51B5',
  en_pause: '#9C27B0',
  termine: '#4CAF50',
  annule: '#F44336'
};

interface ProjectInfoProps {
  reference: string;
  name?: string;
  status?: project_status;
  start_date?: string;
  end_date?: string;
  budget?: number;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const ProjectInfo = memo(({
  reference,
  name,
  status,
  start_date,
  end_date,
  budget,
  description,
  isOpen,
  onToggle
}: ProjectInfoProps) => {
  const [lastPress, setLastPress] = useState(0);
  
  const handlePress = () => {
    console.log("ProjectInfo: PRESSABLE DIRECT TOUCHÉ");
    // Empêcher les doubles clics accidentels
    const now = Date.now();
    if (now - lastPress < 300) return;
    setLastPress(now);
    
    // Appel direct sans logique supplémentaire
    onToggle();
  };
  
  return (
    <Pressable onPress={handlePress}>
      <View style={styles.container}>
        {/* Utilisation de Pressable au lieu de TouchableOpacity pour plus de fiabilité */}
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.pressableArea,
            { backgroundColor: pressed ? '#f0f0f0' : 'transparent' }
          ]}
          android_ripple={{ color: '#f0f0f0', borderless: false }}
        >
          <View style={styles.header}>
            <MaterialIcons name="info" size={22} color="#1e40af" />
            <Text style={styles.headerTitle}>Informations générales</Text>
            <View style={styles.spacer} />
            <Ionicons 
              name={isOpen ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#2563eb" 
            />
          </View>
        </Pressable>
        
        {isOpen && (
          <View style={styles.content}>
            <InfoRow label="Nom du projet:" value={name || ''} />
            <InfoRow label="Référence:" value={reference} bold />
            
            {status && (
              <View style={styles.row}>
                <Text style={styles.label}>Statut:</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[status] }]}>
                  <Text style={styles.statusText}>{statusLabels[status]}</Text>
                </View>
              </View>
            )}
            
            <InfoRow 
              label="Date de début:" 
              value={start_date ? new Date(start_date).toLocaleDateString('fr-FR') : 'Non définie'} 
            />
            
            <InfoRow 
              label="Date de fin:" 
              value={end_date ? new Date(end_date).toLocaleDateString('fr-FR') : 'Non définie'} 
            />
            
            {budget && (
              <InfoRow 
                label="Budget:" 
                value={`${budget.toLocaleString('fr-FR')} €`} 
                bold 
              />
            )}
            
            {description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Description:</Text>
                <Text style={styles.descriptionText}>{description}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
});

// Composant réutilisable pour les lignes d'information
interface InfoRowProps {
  label: string;
  value: string;
  bold?: boolean;
}

const InfoRow = ({ label, value, bold = false }: InfoRowProps) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, bold && styles.boldValue]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    padding: 16,
  },
  pressableArea: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    marginVertical: -8,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  spacer: {
    flex: 1,
  },
  content: {
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#666',
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  boldValue: {
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionLabel: {
    color: '#666',
    marginBottom: 4,
  },
  descriptionText: {
    color: '#333',
    lineHeight: 20,
  }
});

export default ProjectInfo;