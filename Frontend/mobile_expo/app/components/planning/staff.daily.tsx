import { View, Text, ScrollView } from "react-native"
import data from "./data.json"

function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const StaffDaily = () => {
  const renderEvent = (event: any) => (
    <View
      key={event.id}
      className="p-4 bg-white rounded-2xl shadow-md mb-4 border border-gray-100"
    >
      <Text className="text-base font-semibold text-gray-900 mb-1">
        {event.title}
      </Text>

      {event.description && (
        <Text className="text-sm text-gray-600 mb-2">{event.description}</Text>
      )}

      <View className="mb-2">
        <Text className="text-sm text-gray-700">
          🕒 <Text className="font-medium">Début :</Text>{" "}
          {formatDateTime(event.start_date)}
        </Text>
        <Text className="text-sm text-gray-700">
          🕕 <Text className="font-medium">Fin :</Text>{" "}
          {formatDateTime(event.end_date)}
        </Text>
      </View>

      {event.all_day && (
        <Text className="text-xs text-blue-600 font-medium mb-2">
          📅 Événement sur la journée
        </Text>
      )}

      {event.location && (
        <Text className="text-sm text-gray-800 mb-1">
          📍 <Text className="font-medium">Lieu :</Text> {event.location}
        </Text>
      )}

      {event.project_id && (
        <Text className="text-xs text-gray-500 italic">
          Projet ID : {event.project_id}
        </Text>
      )}
    </View>
  )

  return (
    <View className="flex-1 bg-gray-100 pt-4">
      <View className="px-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          🗓️ Programme du jour
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {data.length > 0 ? (
          data.map(renderEvent)
        ) : (
          <Text className="text-center text-gray-500 mt-10">
            Aucun événement prévu pour aujourd’hui.
          </Text>
        )}
      </ScrollView>
    </View>
  )
}

export default StaffDaily
