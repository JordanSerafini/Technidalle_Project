import { Stack } from 'expo-router';
import React from 'react';

export default function EmailsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Emails',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
