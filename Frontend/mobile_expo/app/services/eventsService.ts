import { Alert } from 'react-native';
import useFetch from '../hooks/useFetch';
import { url } from '../utils/url';

// Types d'événements issus de la base de données
export type EventType = 'appel_telephonique' | 'reunion_chantier' | 'visite_technique' | 'rendez_vous_client' | 
                'reunion_interne' | 'formation' | 'livraison_materiaux' | 'intervention_urgente' | 
                'maintenance' | 'autre';

// Interface pour les événements de la BDD
export interface DBEvent {
  id: number;
  title: string;
  description?: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  all_day?: boolean;
  location?: string;
  project_id?: number;
  staff_id?: number;
  client_id?: number;
  status?: string;
  color?: string;
}

// Interface pour les événements du calendrier
export interface AppEvent {
  id: string;
  title: string;
  start: string; // Format ISO
  end: string; // Format ISO
  color?: string;
  metadata?: {
    project_id?: number;
    staff_id?: number;
    client_id?: number;
    event_type?: EventType;
    description?: string;
    location?: string;
    all_day?: boolean;
    status?: string;
  };
}

// URL de base de l'API pour les événements
const API_ENDPOINT = 'events';

// Fonction pour convertir un DBEvent (BDD) en AppEvent (UI)
export const mapDbEventToAppEvent = (event: DBEvent): AppEvent => {
  console.log('Mapping event:', event);
  return {
    id: event.id.toString(),
    title: event.title,
    start: event.start_date, // Format ISO
    end: event.end_date, // Format ISO
    color: event.color || getEventTypeColor(event.event_type),
    metadata: { 
      project_id: event.project_id,
      staff_id: event.staff_id,
      client_id: event.client_id,
      event_type: event.event_type,
      description: event.description,
      location: event.location,
      all_day: event.all_day,
      status: event.status
    }
  };
};

// Fonction pour convertir un AppEvent (UI) en DBEvent (BDD) pour les créations/mises à jour
export const mapAppEventToDbEvent = (event: AppEvent): Partial<DBEvent> => {
  return {
    id: parseInt(event.id),
    title: event.title,
    start_date: event.start,
    end_date: event.end,
    color: event.color,
    project_id: event.metadata?.project_id,
    staff_id: event.metadata?.staff_id,
    client_id: event.metadata?.client_id,
    event_type: event.metadata?.event_type,
    description: event.metadata?.description,
    location: event.metadata?.location,
    all_day: event.metadata?.all_day,
    status: event.metadata?.status
  };
};

// Fonction pour attribuer des couleurs selon le type d'événement
export const getEventTypeColor = (eventType: EventType): string => {
  switch (eventType) {
    case 'appel_telephonique':
      return '#4FC3F7'; // Bleu clair
    case 'reunion_chantier':
      return '#4DB6AC'; // Vert teal
    case 'visite_technique':
      return '#4291EF'; // Bleu
    case 'rendez_vous_client':
      return '#7986CB'; // Bleu indigo
    case 'reunion_interne':
      return '#4CAF50'; // Vert
    case 'formation':
      return '#BA68C8'; // Violet
    case 'livraison_materiaux':
      return '#FF9800'; // Orange
    case 'intervention_urgente':
      return '#F44336'; // Rouge
    case 'maintenance':
      return '#FFB74D'; // Orange clair
    case 'autre':
    default:
      return '#9E9E9E'; // Gris
  }
};

// Hook pour récupérer tous les événements
export const useEvents = (startDate?: Date, endDate?: Date, projectId?: number, staffId?: number) => {
  // Construire les paramètres pour la requête
  const params = new URLSearchParams();
  
  if (startDate) params.append('start_date', startDate.toISOString());
  if (endDate) params.append('end_date', endDate.toISOString());
  if (projectId) params.append('project_id', projectId.toString());
  if (staffId) params.append('staff_id', staffId.toString());
  
  console.log('Fetching events with params:', {
    start_date: startDate?.toISOString(),
    end_date: endDate?.toISOString(),
    project_id: projectId,
    staff_id: staffId
  });

  // En développement, utiliser les données mockées si pas de réponse de l'API
  const { data, loading, error } = useFetch<DBEvent[]>(`${API_ENDPOINT}?${params.toString()}`, {
    method: 'GET'
  });

  console.log('Raw API response:', data);
  
  // Si pas de données de l'API en développement, utiliser les données mockées
  const events: AppEvent[] = data ? data.map(mapDbEventToAppEvent) : __DEV__ ? getMockEvents() : [];
  
  console.log('Processed events:', events);
  
  return { events, loading, error };
};

// Hook pour récupérer les événements d'un projet spécifique
export const useProjectEvents = (projectId: number) => {
  const endpoint = `${API_ENDPOINT}/by-project/${projectId}`;
  
  const { data, loading, error } = useFetch<DBEvent[]>(endpoint, {
    method: 'GET'
  });
  
  const events: AppEvent[] = data ? data.map(mapDbEventToAppEvent) : [];
  
  return { events, loading, error };
};

// Hook pour récupérer les événements d'un membre du personnel
export const useStaffEvents = (staffId: number) => {
  const endpoint = `${API_ENDPOINT}/by-staff/${staffId}`;
  
  const { data, loading, error } = useFetch<DBEvent[]>(endpoint, {
    method: 'GET'
  });
  
  const events: AppEvent[] = data ? data.map(mapDbEventToAppEvent) : [];
  
  return { events, loading, error };
};

// Fonction pour créer un nouvel événement
export const createEvent = async (eventData: Omit<DBEvent, 'id'>): Promise<AppEvent | null> => {
  try {
    const response = await fetch(`${url.local}${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const createdEvent: DBEvent = await response.json();
    return mapDbEventToAppEvent(createdEvent);
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    Alert.alert('Erreur', 'Impossible de créer l\'événement');
    return null;
  }
};

// Fonction pour mettre à jour un événement existant
export const updateEvent = async (eventId: string, updates: Partial<DBEvent>): Promise<boolean> => {
  try {
    const response = await fetch(`${url.local}${API_ENDPOINT}/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    Alert.alert('Erreur', 'Impossible de mettre à jour l\'événement');
    return false;
  }
};

// Fonction pour supprimer un événement
export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${url.local}${API_ENDPOINT}/${eventId}`, {
      method: 'DELETE',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    Alert.alert('Erreur', 'Impossible de supprimer l\'événement');
    return false;
  }
};

// Fonction pour gérer le déplacement d'un événement (drag & drop)
export const moveEvent = async (
  eventId: string, 
  newStartDate: Date, 
  newEndDate: Date
): Promise<boolean> => {
  try {
    const moveData = {
      eventId: parseInt(eventId),
      newStartDate: newStartDate.toISOString(),
      newEndDate: newEndDate.toISOString(),
    };
    
    const response = await fetch(`${url.local}${API_ENDPOINT}/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(moveData),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Erreur lors du déplacement de l\'événement:', error);
    Alert.alert('Erreur', 'Impossible de déplacer l\'événement');
    return false;
  }
};

// Données factices pour le développement
export const getMockEvents = (): AppEvent[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  return [
    {
      id: '1',
      title: 'Visite chantier Dupont',
      start: new Date(year, month, day, 9, 0).toISOString(),
      end: new Date(year, month, day, 11, 30).toISOString(),
      color: '#4291EF',
      metadata: { project_id: 1, event_type: 'visite_technique' }
    },
    {
      id: '2',
      title: 'Livraison matériaux',
      start: new Date(year, month, day + 1, 14, 0).toISOString(),
      end: new Date(year, month, day + 1, 16, 0).toISOString(),
      color: '#FF9800',
      metadata: { project_id: 2, event_type: 'livraison_materiaux' }
    },
    {
      id: '3',
      title: 'Réunion équipe',
      start: new Date(year, month, day + 2, 10, 0).toISOString(),
      end: new Date(year, month, day + 2, 11, 0).toISOString(),
      color: '#4CAF50',
      metadata: { staff_id: 1, event_type: 'reunion_interne' }
    },
    {
      id: '4',
      title: 'RDV Client Martin',
      start: new Date(year, month, day, 15, 0).toISOString(),
      end: new Date(year, month, day, 16, 0).toISOString(),
      color: '#7986CB',
      metadata: { client_id: 3, event_type: 'rendez_vous_client' }
    },
    {
      id: '5',
      title: 'Intervention urgente plomberie',
      start: new Date(year, month, day + 1, 8, 0).toISOString(),
      end: new Date(year, month, day + 1, 10, 0).toISOString(),
      color: '#F44336',
      metadata: { project_id: 4, event_type: 'intervention_urgente' }
    }
  ];
}; 

export default {
  useEvents,
  useProjectEvents,
  useStaffEvents,
  createEvent,
  updateEvent,
};
