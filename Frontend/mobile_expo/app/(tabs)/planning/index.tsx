import React, { useEffect, useState } from "react";
import { Project, Stage } from "@/app/utils/interfaces/project.interface";
import { Client } from "@/app/utils/interfaces/client.interface";
import { useFetch } from "@/app/hooks/useFetch";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function PlanningScreen() {
  const project_id = 442;

  const { data: chantier, loading: chantierLoading, error: chantierError } = useFetch<Project>(`projects/${project_id}`);
  console.log(chantier);

  if (chantierLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (chantierError) {
    return <Text>Error: {chantierError}</Text>;
  }


  return (
    <View>
      <Text>test</Text>
    </View>
  );

}

export default PlanningScreen;
