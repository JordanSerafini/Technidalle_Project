import { View, Text, ScrollView } from "react-native"
import data from "./data.json"
import { EventCard } from "./EventCard"

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
    return (
      <EventCard
        key={event.id}
        title={event.title}
        description={event.description}
        event_type={event.event_type}
        start_date={event.start_date}
        end_date={event.end_date}
        color={event.color}
      />
    )
  }

  return (
    <View className="flex-1 bg-gray-100 pt-4 w-full">
      <View className="px-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          🗓️ Programme du jour
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {data.length > 0 ? (
          data.map(renderEvent)
        ) : (
          <Text className="text-center text-gray-500 mt-10">
            Aucun événement prévu pour aujourd'hui.
          </Text>
        )}
      </ScrollView>
    </View>
  )
}

export default StaffDaily
