import React from 'react';

export interface Stage {
  id: number;
  name: string;
  description?: string;
  projectId: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  clientId?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  stages?: Stage[];
  tags?: Tag[];
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  clientId?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  clientId?: number;
  startDate?: string;
  endDate?: string;
}

// Composant React pour résoudre l'erreur de routing Expo
export default function ProjectInterfaceComponent() {
  return React.createElement(React.Fragment, null);
}

