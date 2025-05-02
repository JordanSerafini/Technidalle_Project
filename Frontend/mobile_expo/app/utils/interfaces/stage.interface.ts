import React from 'react';
import { Tag } from './project.interface';

// Statut possible pour une étape de projet
export enum StageStatus {
  NON_COMMENCEE = 'non_commencee',
  EN_COURS = 'en_cours',
  EN_PAUSE = 'en_pause',
  TERMINE = 'termine',
  ANNULE = 'annule',
}

export interface Stage {
  id: number;
  name: string;
  description?: string;
  projectId: number;
  startDate?: string;
  endDate?: string;
  status?: StageStatus;
  orderIndex?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  completionPercentage?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  synced_at?: string; // Pour compatibilité avec ProjectStage
}

// DTO pour la création d'une étape
export class CreateStageDto {
  name!: string;
  description?: string;
  projectId!: number;
  startDate?: string; 
  endDate?: string;   
  status?: StageStatus = StageStatus.NON_COMMENCEE;
  orderIndex!: number;
  estimatedDuration?: number;
  actualDuration?: number;
  completionPercentage?: number;
  notes?: string;
}

// DTO pour la mise à jour d'une étape
export class UpdateStageDto {
  name?: string;
  description?: string;
  projectId?: number;
  startDate?: string; 
  endDate?: string;   
  // startTime et endTime sont implicitement dans startDate et endDate si format ISO complet
  status?: StageStatus;
  orderIndex?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  completionPercentage?: number;
  notes?: string;
}

// Composant React pour résoudre l'erreur de routing Expo
export default function StageInterfaceComponent() {
  return React.createElement(React.Fragment, null);
}

