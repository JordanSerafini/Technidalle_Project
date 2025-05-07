export interface StageSummary {
  id: number;
  name: string;
  description?: string | null;
  status?: string | null;
  order_index: number;
}

export interface ProjectSummary {
    id: number;
    name: string;
    reference: string;
    status?: string | null;
    notes?: string | null;
    addresses?: {
      id: number;
      street_number?: string | null;
      street_name: string;
      zip_code: string;
      city: string;
    } | null;
    clients?: { 
      id: number;
      firstname: string;
      lastname: string;
      company_name?: string | null;
    } | null;
  }

  export interface ScheduleAssignment {
    date: string;
    startTime: string;
    endTime: string;
    project: ProjectSummary | { id: number; name: string };
    stage?: StageSummary | null;
  }
  
  export interface DailyScheduleResponse {
    date: string;
    staffId: string;
    chantiers: ScheduleAssignment[];
  }
  
  export interface WeeklyScheduleResponse {
    weekOf: string;
    staffId: string;
    planning: {
      [date: string]: ScheduleAssignment[];
    };
  }


  export interface PlanningAddressSummary {
      id: number;
      street_number: string | null;
      street_name: string;
      additional_address: string | null;
      zip_code: string;
      city: string;
      country: string | null;
      latitude?: number | null; 
      longitude?: number | null;
      created_at?: string;
      updated_at?: string;
  }

  export interface PlanningClientSummary {
      id: number;
      customer_id?: string | null;
      company_name: string | null;
      firstname: string;
      lastname: string;
      email?: string;
      phone?: string | null;
      mobile?: string | null;
      address_id?: number | null;
      siret?: string | null;
      notes?: string | null;
      created_at?: string;
      updated_at?: string;
  }

  export interface PlanningProjectSummary {
      id: number;
      name: string;
      reference: string;
      addresses?: PlanningAddressSummary | null;
      clients?: PlanningClientSummary | null;
  }

  export interface PlanningStageSummary {
      id: number;
      name: string;
      status: string; 
  }

  export interface ScheduleItem {
      type: 'event' | 'assignment';
      id: string;
      title: string;
      startTime: string;
      endTime: string | null;
      allDay: boolean;
      project?: PlanningProjectSummary | null;
      stage?: PlanningStageSummary | null;
      role?: string | null;
      eventType?: string | null;
      actualStartTime?: string | null;
      actualEndTime?: string | null;
  }

  export interface DailyPlanningResponse {
      date: string;
      staffId: string;
      schedule: ScheduleItem[];
  }

  export interface WeeklyPlanningResponse {
      weekOf: string;
      staffId: string;
      planning: {
          [date: string]: ScheduleItem[];
      };
  }

  export type PlanningResponse = DailyPlanningResponse | WeeklyPlanningResponse;

  // Ajouter un export par défaut pour résoudre l'erreur d'Expo Router
  export default function PlanningInterfaceExport() {
    return null;
  }