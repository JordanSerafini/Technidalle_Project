import React from 'react';
import { View, Text } from "react-native";

export function PlanningScreen() {
  return (
    <View className="flex-1 items-center p-4">
      <Text className="text-2xl font-bold mb-4">Planning</Text>
      <View className="bg-white p-4 rounded shadow w-full">
        <Text className="text-black">Gérez votre planning ici</Text>
      </View>
    </View>
  )
} 

export default PlanningScreen;