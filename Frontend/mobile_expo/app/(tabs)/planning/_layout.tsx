import { Stack } from 'expo-router';
import React from 'react';

export default function PlanningLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Planning',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
