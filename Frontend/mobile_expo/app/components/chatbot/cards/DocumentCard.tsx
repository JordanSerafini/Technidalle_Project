import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';
import { DocumentCardProps } from '@/app/utils/interfaces/datacard.interface';

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(document);
    } else {
      router.push({
        pathname: '/(tabs)/documents/[id]',
        params: { id: document.id.toString() },
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return 'Date invalide';
    }
  };

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'devis':
        return 'document-text';
      case 'facture':
        return 'receipt';
      case 'bon_de_commande':
        return 'cart';
      case 'bon_de_livraison':
        return 'cube';
      case 'fiche_technique':
        return 'document-attach';
      case 'photo_chantier':
        return 'camera';
      case 'plan':
        return 'map';
      default:
        return 'document';
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#6b7280';
    switch (status.toLowerCase()) {
      case 'brouillon':
        return '#6b7280';
      case 'en_attente':
        return '#f59e0b';
      case 'valide':
        return '#10b981';
      case 'refuse':
        return '#ef4444';
      case 'annule':
        return '#9ca3af';
      default:
        return '#6b7280';
    }
  };

  const formatDocumentType = (type: string) => type.replace(/_/g, ' ');

  return (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-2 shadow-sm border border-gray-200"
      onPress={onPress ? () => onPress(document) : handlePress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-bold">{document.reference}</Text>
          <Text className="text-gray-600 text-sm">{formatDocumentType(document.type)}</Text>
          {document.status && (
            <Text style={{ color: getStatusColor(document.status) }} className="text-sm font-medium mt-1">
              {document.status.replace(/_/g, ' ')}
            </Text>
          )}
        </View>
        <View className="rounded-full p-2" style={{ backgroundColor: '#e0f2fe' }}>
          <Ionicons name={getIconForType(document.type)} size={24} color="#0284c7" />
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row flex-wrap justify-between">
          <View className="flex-row items-center mb-1 mr-2">
            <Ionicons name="calendar" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-1 text-sm">
              {formatDate(document.issue_date)}
              {document.due_date ? ` - ${formatDate(document.due_date)}` : ''}
            </Text>
          </View>

          {document.amount !== undefined && (
            <View className="flex-row items-center mb-1">
              <Ionicons name="cash" size={16} color="#6b7280" />
              <Text className="text-gray-700 ml-1 text-sm">
                {document.amount ? document.amount.toLocaleString('fr-FR') : '0'} €
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default DocumentCard;
