import React from 'react';
import { View, Text } from "react-native";
import Tableau from '../components/tableau';

export function DashboardScreen() {
  return (
    <View className="flex-1 items-center p-4">
      <Tableau />
    </View>
  )
} 

export default DashboardScreen;