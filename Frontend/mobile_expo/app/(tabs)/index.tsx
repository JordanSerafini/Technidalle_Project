import { View, Text } from "react-native";

export function DashboardScreen() {
  return (
    <View className="flex-1 items-center p-4">
      <Text className="text-2xl font-bold mb-4">Dashboard</Text>
      <View className="bg-white p-4 rounded shadow w-full">
        <Text className="text-black">Bienvenue sur votre tableau de bord</Text>
      </View>
    </View>
  )
} 

export default DashboardScreen;