import React from 'react';
import { View, Text } from 'react-native';
import { eventTypeColors } from '../../utils/constants/eventTypeColors';
import type { Event } from '../../utils/interfaces/event.interface';

interface EventCardProps extends Omit<Event, 'id'> {}

function formatHourRange(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

export function EventCard({
  title,
  description,
  event_type,
  start_date,
  end_date,
  color,
}: EventCardProps) {
  const bandColor = eventTypeColors[event_type] ?? '#CCCCCC';

  return (
    <View className="flex-row bg-white rounded-xl my-2 shadow-sm min-h-[80px] items-stretch w-full" accessibilityRole="summary">
      <View style={{ backgroundColor: bandColor }} className="w-2 rounded-l-xl" />
      <View className="flex-1 p-3 justify-center">
        <Text className="text-xs font-bold text-gray-500 mb-1 capitalize">{event_type.replace(/_/g, ' ')}</Text>
        <Text className="text-base font-semibold text-gray-900">{title}</Text>
        <Text className="text-sm text-blue-600 font-medium mb-1">{formatHourRange(start_date, end_date)}</Text>
        {description && <Text className="text-sm text-gray-600 mt-1">{description}</Text>}
      </View>
    </View>
  );
} 