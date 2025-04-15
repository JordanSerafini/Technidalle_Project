export enum EventType {
  APPEL_TELEPHONIQUE = 'appel_telephonique',
  REUNION_CHANTIER = 'reunion_chantier',
  VISITE_TECHNIQUE = 'visite_technique',
  RENDEZ_VOUS_CLIENT = 'rendez_vous_client',
  REUNION_INTERNE = 'reunion_interne',
  FORMATION = 'formation',
  LIVRAISON_MATERIAUX = 'livraison_materiaux',
  INTERVENTION_URGENTE = 'intervention_urgente',
  MAINTENANCE = 'maintenance',
  AUTRE = 'autre',
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  event_type: EventType;
  start_date: Date;
  end_date: Date;
  all_day?: boolean;
  location?: string;
  project_id?: number;
  staff_id?: number;
  client_id?: number;
  status?: string;
  color?: string;
  created_at?: Date;
  updated_at?: Date;
  // Relations
  projects?: any;
  staff?: any;
  clients?: any;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  event_type: EventType;
  start_date: Date;
  end_date: Date;
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
  event_type?: EventType;
  start_date?: Date;
  end_date?: Date;
  all_day?: boolean;
  location?: string;
  project_id?: number;
  staff_id?: number;
  client_id?: number;
  status?: string;
  color?: string;
}

export interface EventQueryParams {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  staffId?: string;
  clientId?: string;
}

export interface CalendarViewOptions {
  view: 'day' | 'week' | 'month';
  date: string;
}

export interface MoveEventParams {
  eventId: number;
  newStartDate: Date;
  newEndDate: Date;
}
