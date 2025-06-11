import { Redirect } from 'expo-router';
import React from 'react';

export default function Index() {
  // Bypass de l'authentification pour le développement - toujours connecté
  return <Redirect href="/(tabs)/dashboard" />;
}
