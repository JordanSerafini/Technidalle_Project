import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';
import { ProjectCardProps } from '@/app/utils/interfaces/datacard.interface';

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(project);
    } else {
      router.push({
        pathname: '/(tabs)/projects/[id]',
        params: { id: project.id.toString() },
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

  let statusIcon: any = 'time';
  let statusColor = '#6b7280';
  switch (project.status) {
    case 'en_cours':
      statusIcon = 'play-circle';
      statusColor = '#3b82f6';
      break;
    case 'terminé':
      statusIcon = 'checkmark-circle';
      statusColor = '#10b981';
      break;
    case 'en_attente':
      statusIcon = 'pause-circle';
      statusColor = '#f59e0b';
      break;
    case 'annulé':
      statusIcon = 'close-circle';
      statusColor = '#ef4444';
      break;
  }

  return (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-2 shadow-sm border border-gray-200"
      onPress={onPress ? () => onPress(project) : handlePress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-bold">{project.name}</Text>
          <Text className="text-gray-600 text-sm">{project.reference}</Text>
          <Text className="text-gray-500 mt-1 text-sm">{project.description}</Text>
        </View>
        <View style={{ backgroundColor: `${statusColor}20` }} className="rounded-full p-2">
          <Ionicons name={statusIcon} size={24} color={statusColor} />
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row flex-wrap justify-between">
          <View className="flex-row items-center mb-1 mr-2">
            <Ionicons name="calendar" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-1 text-sm">
              {formatDate(project.start_date)} - {formatDate(project.end_date)}
            </Text>
          </View>

          <View className="flex-row items-center mb-1">
            <Ionicons name="cash" size={16} color="#6b7280" />
            <Text className="text-gray-700 ml-1 text-sm">
              {project.budget ? project.budget.toLocaleString('fr-FR') : '0'} €
            </Text>
          </View>
        </View>

        {project.notes && (
          <View className="mt-1">
            <Text className="text-gray-600 text-sm italic">{project.notes}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ProjectCard;
