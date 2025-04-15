import { Redirect } from 'expo-router';
import React from 'react';

export default function Index() {
  // Rediriger vers la route par défaut des onglets (projects)
  return <Redirect href="/(tabs)/projects" />;
} 