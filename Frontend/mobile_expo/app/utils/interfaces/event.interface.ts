import React from 'react';

// Types d'événements issus de la base de données
export type event_type = 
  | 'appel_telephonique' 
  | 'reunion_chantier' 
  | 'visite_technique' 
  | 'rendez_vous_client'
  | 'reunion_interne' 
  | 'formation' 
  | 'livraison_materiaux' 
  | 'intervention_urgente'
  | 'maintenance' 
  | 'autre';

// Interface pour les événements tels que dans la base de données
export interface Event {
  id: number;
  title: string;
  description?: string;
  event_type: event_type;
  start_date: string; // format ISO
  end_date: string; // format ISO
  all_day?: boolean;
  location?: string;
  project_id?: number;
  staff_id?: number;
  client_id?: number;
  status?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface pour les événements du calendrier
export interface CalendarEventData {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  metadata?: {
    project_id?: number;
    staff_id?: number;
    client_id?: number;
    event_type?: event_type;
    description?: string;
    location?: string;
    all_day?: boolean;
    status?: string;
  };
}

// DTOs
export interface CreateEventDto {
  title: string;
  description?: string;
  event_type: event_type;
  start_date: string; // format ISO
  end_date: string; // format ISO
  all_day?: boolean;
  location?: string;
  project_id?: number;
  staff_id?: number;
  client_id?: number;
  status?: string;
  color?: string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  event_type?: event_type;
  start_date?: string; // format ISO
  end_date?: string; // format ISO
  all_day?: boolean;
  location?: string;
  project_id?: number;
  staff_id?: number;
  client_id?: number;
  status?: string;
  color?: string;
}

// Composant React pour résoudre l'erreur de routing Expo
export default function EventInterfaceComponent() {
  return React.createElement(React.Fragment, null);
} 