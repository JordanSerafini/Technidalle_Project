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

// 🔵 Associe chaque type à une couleur
const eventTypeColors: Record<string, string> = {
  réunion: "#3B82F6",       // bleu
  chantier: "#F97316",      // orange
  visite: "#10B981",        // vert
  intervention: "#EF4444",  // rouge
  autre: "#9CA3AF"          // gris
}

const StaffDaily = () => {
  const renderEvent = (event: any) => {
    const color = eventTypeColors[event.event_type?.toLowerCase()] || eventTypeColors["autre"]

    return (
      <View
        key={event.id}
        className="flex-row mb-4 shadow-md rounded-2xl overflow-hidden"
      >
        {/* Banderole colorée */}
        <View style={{ width: 6, backgroundColor: color }} />

        {/* Contenu de la carte */}
        <View className="flex-1 bg-white p-4 border border-gray-100">
          {/* Type d’événement */}
          <Text
            className="text-xs font-bold uppercase mb-2"
            style={{ color }}
          >
            {event.event_type || "Autre"}
          </Text>

          <Text className="text-base font-semibold text-gray-900 mb-1">
            {event.title}
          </Text>

          {event.description && (
            <Text className="text-sm text-gray-600 mb-2">{event.description}</Text>
          )}

          <View className="mb-2">
            <Text className="text-sm text-gray-700">
              🕒 <Text className="font-medium">Début :</Text> {formatDateTime(event.start_date)}
            </Text>
            <Text className="text-sm text-gray-700">
              🕕 <Text className="font-medium">Fin :</Text> {formatDateTime(event.end_date)}
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
      </View>
    )
  }

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
