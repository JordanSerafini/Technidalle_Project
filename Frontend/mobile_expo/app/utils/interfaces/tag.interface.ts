import React from 'react';

export interface Tag {
  id: number;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// Composant React pour résoudre l'erreur de routing Expo
export default function TagInterfaceComponent() {
  return React.createElement(React.Fragment, null);
}
