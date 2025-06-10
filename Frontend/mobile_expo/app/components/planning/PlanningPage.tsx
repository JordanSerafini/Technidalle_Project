import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { PlanningCard } from './PlanningCard'
import type { PlanningItem } from '../../utils/interfaces/planning-item.interface'

const API_EVENTS = 'https://mon-api.com/events?staff_id=XXX'
const API_TASKS = 'https://mon-api.com/tasks?assigned_to=XXX'

export default function PlanningPage() {
  const [items, setItems] = useState<PlanningItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(API_EVENTS).then(res => res.json()),
      fetch(API_TASKS).then(res => res.json()),
    ]).then(([events, tasks]) => {
      setItems([
        ...events.map((e: any) => ({ ...e, type: 'event' })),
        ...tasks.map((t: any) => ({ ...t, type: 'task' })),
      ])
      setIsLoading(false)
    })
  }, [])

  function handleValidate(id: number, type: 'event' | 'task') {
    setItems(items =>
      items.map(item =>
        item.id === id && item.type === type
          ? { ...item, status: 'terminé' }
          : item
      )
    )
  }

  if (isLoading) return <ActivityIndicator size="large" color="#888" />

  return (
    <View className="flex-1 bg-gray-100 pt-4">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {items.length > 0 ? (
          items
            .sort((a, b) =>
              (a.type === 'event' ? a.start_date : a.due_date || '') >
              (b.type === 'event' ? b.start_date : b.due_date || '')
                ? 1
                : -1
            )
            .map(item => (
              <PlanningCard key={item.type + item.id} item={item} onValidate={handleValidate} />
            ))
        ) : (
          <Text className="text-center text-gray-500 mt-10">
            Aucun événement ou tâche prévue pour aujourd'hui.
          </Text>
        )}
      </ScrollView>
    </View>
  )
} 