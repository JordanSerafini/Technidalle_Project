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
  reference: string;
  name: string;
  description?: string;
  client_id?: number;
  address_id?: number;
  status?: project_status;
  start_date?: string;
  end_date?: string;
  estimated_duration?: number;
  budget?: number;
  actual_cost?: number;
  margin?: number;
  priority?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  addresses?: Address;
  stages?: Stage[];
  tags?: Tag[];
  project_stages?: ProjectStage[];
  project_tags?: { 
    project_id: number;
    tag_id: number;
    tags?: Tag;
  }[];
  clients?: {
    id: number;
    company_name?: string;
    firstname: string;
    lastname: string;
    email: string;
    phone?: string;
    mobile?: string;
    address_id?: number;
    siret?: string;
    notes?: string;
  };
  documents?: Document[];
  events?: Event[];
}

export enum project_status {
  prospect = 'prospect',
  devis_en_cours = 'devis_en_cours',
  devis_accepte = 'devis_accepte',
  en_preparation = 'en_preparation',
  en_cours = 'en_cours',
  en_pause = 'en_pause',
  termine = 'termine',
  annule = 'annule'
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

// Interface pour les adresses
export interface Address {
  id: number;
  street_number?: string;
  street_name: string;
  additional_address?: string;
  zip_code: string;
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

// Interface pour les étapes de projet telles que retournées par l'API
export interface ProjectStage {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  order_index: number;
  estimated_duration?: number;
  actual_duration?: number;
  completion_percentage?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  synced_at?: string | null;
  synced_by_device_id?: string | null;
}

// Composant React pour résoudre l'erreur de routing Expo
export default function ProjectInterfaceComponent() {
  return React.createElement(React.Fragment, null);
}

