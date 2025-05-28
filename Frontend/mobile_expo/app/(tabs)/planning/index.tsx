import { useFetch } from "@/app/hooks/useFetch";
import { ActivityIndicator, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { useState, useCallback } from "react";
import { DailyPlanningResponse, WeeklyPlanningResponse, PlanningResponse } from "@/app/utils/interfaces/planning.interface";

export function PlanningScreen() {
  const staffId = 1;
  const [ time, setTime ] = useState<string>('today');
  const { data: planning, loading: planningLoading, error: planningError } = useFetch<PlanningResponse | null>(`events/staff/${staffId}/schedule/${time}`);


  if (planningLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  if (planningError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-red-600 text-base">Erreur lors du chargement du planning: {planningError}</Text>
      </SafeAreaView>
    );
  }

  const renderPlanning = () => {
    if (!planning) {
      return (
        <View className="flex-1 justify-center items-center">
          <Text>Aucune donnée de planning.</Text>
        </View>
      );
    }

    if ('schedule' in planning && time === 'today') {
      const dailyPlanning = planning as DailyPlanningResponse;
      return (
        <ScrollView className="flex-1 p-4">
          <Text className="text-lg font-bold mb-2">Planning pour le {dailyPlanning.date}:</Text>
          {dailyPlanning.schedule.length === 0 ? (
            <Text className="italic text-gray-600 mt-1">Rien de prévu.</Text>
          ) : (
            dailyPlanning.schedule.map(item => (
              <View key={item.id} className={`my-2 p-3 border rounded bg-white ${item.type === 'event' ? 'border-blue-500' : 'border-green-500'}`}>
                <Text className="font-bold text-gray-700 mb-1">Type: {item.type}</Text>
                <Text className="text-base font-bold mb-1">Titre: {item.title}</Text>
                <Text>Projet: {item.project?.name ?? 'N/A'}</Text>
                <Text>Étape: {item.stage?.name ?? 'N/A'}</Text>
                {item.role && <Text>Rôle: {item.role}</Text>}
                {item.type === 'assignment' && item.stage && (item.startTime || item.actualStartTime) && (item.endTime || item.actualEndTime) && (
                  <Text>Horaires: {
                    (item.actualStartTime && item.actualEndTime)
                      ? `${new Date(item.actualStartTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(item.actualEndTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                      : item.allDay
                        ? 'Toute la journée'
                        : (item.startTime && item.endTime)
                          ? `${new Date(item.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(item.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                          : 'Horaires non spécifiés'
                  }</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      );
    } else if ('planning' in planning && time === 'week') {
      const weeklyPlanning = planning as WeeklyPlanningResponse;
      return (
        <ScrollView className="flex-1 p-4">
          <Text className="text-lg font-bold mb-2">Planning pour la semaine du {weeklyPlanning.weekOf}:</Text>
          {Object.entries(weeklyPlanning.planning).map(([date, items]) => (
            <View key={date} className="mt-2 mb-1">
              <Text className="font-bold text-base mb-1 text-gray-700">
                {new Date(date + 'T00:00:00Z').toLocaleDateString('fr-FR', {
                  weekday: 'long', day:'numeric', month:'long'
                })}:
              </Text>
              {items.length === 0 ? (
                <Text className="ml-2 italic text-gray-600"> - Rien</Text>
              ) : (
                items.map(item => (
                  <Text key={item.id} className="ml-2 text-sm text-gray-700"> - {item.title} ({item.type})</Text>
                ))
              )}
            </View>
          ))}
        </ScrollView>
      );
    }

    return (
      <View className="flex-1 justify-center items-center">
         <Text>Format de planning non reconnu.</Text>
      </View>
     );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 p-4">
        <View className="flex-row mb-4 justify-center">
          <TouchableOpacity
            onPress={() => setTime('today')}
            className={`py-2 px-4 rounded mx-1 ${time === 'today' ? 'bg-blue-500' : 'bg-gray-400'}`}
          >
            <Text className="text-white font-bold">Aujourd'hui</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTime('week')}
            className={`py-2 px-4 rounded mx-1 ${time === 'week' ? 'bg-blue-500' : 'bg-gray-400'}`}
          >
            <Text className="text-white font-bold">Semaine</Text>
          </TouchableOpacity>
        </View>
        {renderPlanning()}
      </View>
    </SafeAreaView>
  );
}


export default PlanningScreen;
