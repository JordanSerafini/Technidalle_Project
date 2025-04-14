import React from 'react';
import { Tag } from './project.interface';

export interface Stage {
  id: number;
  name: string;
  description?: string;
  projectId: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

// Composant React pour résoudre l'erreur de routing Expo
export default function StageInterfaceComponent() {
  return React.createElement(React.Fragment, null);
}

