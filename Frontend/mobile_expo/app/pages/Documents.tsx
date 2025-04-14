import React from 'react';
import { View, Text } from "react-native";

export function Documents() {
  return (
    <View className="flex-1 items-center p-4">
      <Text className="text-2xl font-bold mb-4">Documents</Text>
      <View className="bg-white p-4 rounded shadow w-full">
        <Text className="text-black">Vos documents importants</Text>
      </View>
    </View>
  )
} 

export default Documents;