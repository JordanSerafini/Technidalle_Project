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