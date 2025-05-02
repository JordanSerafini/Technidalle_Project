// Exemple pour Frontend/mobile_expo/app/utils/interfaces/planning.interface.ts

// Interface simplifiée pour une étape de projet (correspondance backend)
export interface StageSummary {
  id: number;
  name: string;
  description?: string | null;
  status?: string | null;
  order_index: number;
  // Ajoutez d'autres champs si nécessaire
}

// Interface pour les détails simplifiés du projet dans le planning
export interface ProjectSummary {
    id: number;
    name: string;
    reference: string;
    status?: string | null;
    notes?: string | null;
    addresses?: { // Reprend la définition de AddressSummary du backend
      id: number;
      street_number?: string | null;
      street_name: string;
      zip_code: string;
      city: string;
    } | null;
    clients?: { // Reprend la définition de ClientSummary du backend
      id: number;
      firstname: string;
      lastname: string;
      company_name?: string | null;
    } | null;
    // project_stages est retiré
  }
  
  // Interface pour une affectation individuelle
  // Modifiée pour avoir project ET stage
  export interface ScheduleAssignment {
    date: string;
    startTime: string;
    endTime: string;
    project: ProjectSummary | { id: number; name: string }; // Détails du projet global
    stage?: StageSummary | null; // Détails de l'étape spécifique (si fournie)
  }
  
  // Interface pour la réponse du planning journalier
  export interface DailyScheduleResponse {
    date: string;
    staffId: string;
    // Le contenu est maintenant un tableau de ScheduleAssignment enrichi
    chantiers: ScheduleAssignment[];
  }
  
  // Interface pour la réponse du planning hebdomadaire
  export interface WeeklyScheduleResponse {
    weekOf: string;
    staffId: string;
    planning: {
      // Le contenu est maintenant un tableau de ScheduleAssignment enrichi
      [date: string]: ScheduleAssignment[];
    };
  }

  // Frontend/mobile_expo/app/utils/interfaces/planning.interface.ts

  // Interfaces simplifiées pour les données imbriquées dans le planning
  // Adaptées de vos interfaces existantes si possible, ou définies ici

  export interface PlanningAddressSummary {
      id: number;
      street_number: string | null;
      street_name: string;
      additional_address: string | null;
      zip_code: string;
      city: string;
      country: string | null;
      latitude?: number | null; // Champs de project.interface mais optionnels ici ?
      longitude?: number | null;
      created_at?: string; // Optionnel ?
      updated_at?: string; // Optionnel ?
  }

  export interface PlanningClientSummary {
      id: number;
      customer_id?: string | null;
      company_name: string | null;
      firstname: string;
      lastname: string;
      email?: string; // Optionnel ?
      phone?: string | null;
      mobile?: string | null;
      address_id?: number | null;
      siret?: string | null;
      notes?: string | null;
      created_at?: string; // Optionnel ?
      updated_at?: string; // Optionnel ?
  }

  export interface PlanningProjectSummary {
      id: number;
      name: string;
      reference: string;
      addresses?: PlanningAddressSummary | null;
      clients?: PlanningClientSummary | null;
      // Ajouter d'autres champs si nécessaire (ex: status)
  }

  export interface PlanningStageSummary {
      id: number;
      name: string;
      status: string; // Pourrait être un enum StageStatus si défini globalement
  }

  // Interface pour un élément dans le planning (événement ou assignation)
  export interface ScheduleItem {
      type: 'event' | 'assignment';
      id: string;
      title: string;
      startTime: string; // ISO Date string
      endTime: string | null; // ISO Date string or null
      allDay: boolean;
      project?: PlanningProjectSummary | null;
      stage?: PlanningStageSummary | null;
      // Champs spécifiques
      role?: string | null; // Pour 'assignment'
      eventType?: string | null; // Pour 'event'
      // Potentiellement d'autres champs comme assignmentStartDate, assignmentEndDate
  }

  // Interface pour la réponse de l'endpoint /schedule/today
  export interface DailyPlanningResponse {
      date: string;
      staffId: string;
      schedule: ScheduleItem[];
  }

  // Interface pour la réponse de l'endpoint /schedule/week (structure différente)
  export interface WeeklyPlanningResponse {
      weekOf: string;
      staffId: string;
      planning: {
          [date: string]: ScheduleItem[]; // Clé est la date YYYY-MM-DD
      };
  }

  // Type générique pour la réponse du planning, peut être l'un ou l'autre
  export type PlanningResponse = DailyPlanningResponse | WeeklyPlanningResponse;