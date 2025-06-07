import { Stack } from "expo-router";

export default function FacturesLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",

        headerStyle: {
          backgroundColor: "#2563eb",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerBackVisible: true,
        headerBackTitle: "Retour",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Factures",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{
          title: "Détail facture",
          headerBackTitle: "Factures",
        }}
      />
    </Stack>
  );
}
