import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';
import { ScheduleCardProps } from '@/app/utils/interfaces/datacard.interface';

const ScheduleCard: React.FC<ScheduleCardProps> = ({ scheduleItem, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(scheduleItem);
    } else if (scheduleItem.project?.id) {
      router.push({
        pathname: '/(tabs)/projects/[id]',
        params: { id: scheduleItem.project.id.toString() },
      });
    } else {
      router.push({ pathname: '/(tabs)/planning' });
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    try {
      return format(new Date(timeString), 'HH:mm', { locale: fr });
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-2 shadow-sm border border-gray-200"
      onPress={onPress ? () => onPress(scheduleItem) : handlePress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-bold">{scheduleItem.title}</Text>
          <Text className="text-gray-600 text-sm">
            {scheduleItem.type === 'event' ? 'Événement' : 'Mission'}
            {scheduleItem.eventType ? ` • ${scheduleItem.eventType}` : ''}
          </Text>
          {scheduleItem.project?.name && (
            <Text className="text-blue-600 text-sm mt-1">
              Projet: {scheduleItem.project.name}
            </Text>
          )}
          {scheduleItem.stage?.name && (
            <Text className="text-gray-700 text-sm">Étape: {scheduleItem.stage.name}</Text>
          )}
        </View>
        <View
          className="rounded-full p-2"
          style={{ backgroundColor: scheduleItem.type === 'event' ? '#dbeafe' : '#dcfce7' }}
        >
          <Ionicons
            name={scheduleItem.type === 'event' ? 'calendar' : 'construct'}
            size={24}
            color={scheduleItem.type === 'event' ? '#2563eb' : '#16a34a'}
          />
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row items-center">
          <Ionicons name="time" size={16} color="#6b7280" />
          <Text className="text-gray-700 ml-1 text-sm">
            {scheduleItem.allDay
              ? 'Toute la journée'
              : `${formatTime(scheduleItem.startTime)}${
                  scheduleItem.endTime ? ` - ${formatTime(scheduleItem.endTime)}` : ''
                }`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ScheduleCard;
