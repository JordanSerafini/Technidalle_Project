import React from 'react';

export interface AccordionItemProps {
  isExpanded: boolean;
  children: React.ReactNode;
  maxHeight?: number;
}

// Ajouter un export par défaut pour résoudre l'erreur d'Expo Router
export default function AccordionTypesExport() {
  return null;
} 