import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { eventTypeColors } from '../../utils/constants/eventTypeColors'
import type { PlanningItem } from '../../utils/interfaces/planning-item.interface'

function formatHourRange(start?: string, end?: string) {
  if (!start || !end) return null
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

export function PlanningCard({
  item,
  onValidate,
}: {
  item: PlanningItem
  onValidate?: (id: number, type: 'event' | 'task') => void
}) {
  const bandColor =
    item.type === 'event'
      ? eventTypeColors[item.event_type] ?? '#CCCCCC'
      : '#6366F1' // violet pour les tâches

  const isDone =
    (item.type === 'event' && item.status === 'terminé') ||
    (item.type === 'task' && item.status === 'terminé')

  return (
    <View
      className={`flex-row rounded-xl my-2 min-h-[80px] items-stretch shadow-sm w-full ${
        isDone ? 'opacity-60' : 'bg-white'
      }`}
      accessibilityRole="summary"
    >
      <View style={{ backgroundColor: bandColor }} className="w-2 rounded-l-xl" />
      <View className="flex-1 p-3 justify-center">
        <View className="flex-row items-center mb-1">
          <Text className="text-xs font-bold capitalize text-gray-500 mr-2">
            {item.type === 'event'
              ? item.event_type.replace(/_/g, ' ')
              : 'Tâche'}
          </Text>
          {item.status && (
            <Text
              className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                item.status === 'en_cours'
                  ? 'bg-blue-100 text-blue-700'
                  : item.status === 'planifié' || item.status === 'à_faire'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {item.status}
            </Text>
          )}
        </View>
        <Text className="text-base font-semibold text-gray-900">
          {item.type === 'event' ? item.title : item.label}
        </Text>
        {item.type === 'event' && (
          <Text className="text-sm text-blue-600 font-medium mb-1">
            {formatHourRange(item.start_date, item.end_date)}
          </Text>
        )}
        {item.type === 'task' && item.due_date && (
          <Text className="text-sm text-blue-600 font-medium mb-1">
            À faire avant {new Date(item.due_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
        {item.type === 'event' && item.location && (
          <Text className="text-xs text-gray-400 mb-1">📍 {item.location}</Text>
        )}
        {item.project_name && (
          <Text className="text-xs text-gray-500 mb-1">Projet : {item.project_name}</Text>
        )}
        {item.stage_name && (
          <Text className="text-xs text-gray-400 mb-1">Étape : {item.stage_name}</Text>
        )}
        {item.description && (
          <Text className="text-sm text-gray-600 mt-1">{item.description}</Text>
        )}
        {!isDone && (
          <Pressable
            className="mt-2 self-end bg-green-500 px-3 py-1 rounded-full"
            onPress={() => onValidate?.(item.id, item.type)}
            accessibilityLabel="Valider"
          >
            <Text className="text-white text-xs font-bold">Valider</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
} 