import React, { useEffect, useState } from "react";
import { Project, Stage } from "@/app/utils/interfaces/project.interface";
import { Client } from "@/app/utils/interfaces/client.interface";
import { useFetch } from "@/app/hooks/useFetch";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const mockData: Stage[] = [
  {
    id: 1,
    name: "Étape 1 : Préparation du terrain",
    description: "Nettoyage et nivellement du site.",
    project_id: 1,
    start_date: "2023-10-01",
    end_date: "2023-10-05",
    status: "termine",
    order_index: 1,
    estimated_duration: 5, // en jours
    actual_duration: 5, // en jours
    completion_percentage: 100,
    notes: "Terrain prêt pour la fondation.",
    created_at: "2023-09-25T10:00:00Z",
    updated_at: "2023-10-05T16:30:00Z",
    synced_at: undefined,
    synced_by_device_id: undefined
  },
  {
    id: 2,
    name: "Étape 2 : Fondations",
    description: "Coulage des fondations en béton.",
    project_id: 1,
    start_date: "2023-10-06",
    end_date: "2023-10-15",
    status: "en_cours",
    order_index: 2,
    estimated_duration: 10, // en jours
    actual_duration: undefined, // en cours
    completion_percentage: 75,
    notes: "Béton en cours de séchage. Quelques retards dus à la météo.",
    created_at: "2023-09-25T10:05:00Z",
    updated_at: "2023-10-14T11:00:00Z",
    synced_at: "2023-10-14T11:05:00Z",
    synced_by_device_id: "device_123"
  },
  {
    id: 3,
    name: "Étape 3 : Élévation des murs",
    description: "Montage de la structure et des murs porteurs.",
    project_id: 1,
    start_date: "2023-10-16",
    end_date: "2023-10-30", // Date de fin prévue
    status: "non_commencee",
    order_index: 3,
    estimated_duration: 15, // en jours
    actual_duration: undefined,
    completion_percentage: 0,
    notes: "Matériaux livrés, en attente du début.",
    created_at: "2023-09-25T10:10:00Z",
    updated_at: "2023-10-15T09:00:00Z",
    synced_at: undefined,
    synced_by_device_id: undefined
  },
  {
    id: 4,
    name: "Étape 4 : Toiture",
    description: "Installation de la charpente et de la couverture.",
    project_id: 1,
    start_date: "2023-11-01", // Date de début prévue
    end_date: "2023-11-10", // Date de fin prévue
    status: "non_commencee",
    order_index: 4,
    estimated_duration: 10, // en jours
    actual_duration: undefined,
    completion_percentage: 0,
    notes: "Planification en cours.",
    created_at: "2023-09-25T10:15:00Z",
    updated_at: "2023-09-25T10:15:00Z",
    synced_at: undefined,
    synced_by_device_id: undefined
  },

];

export function PlanningScreen() {
  const project_id = 300;

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
