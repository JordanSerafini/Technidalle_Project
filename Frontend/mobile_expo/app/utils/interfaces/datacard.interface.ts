
interface ClientData {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    phone: string | null;
    addresses: {
      city: string;
    };
    created_at: string;
  }
  
  interface ProjectData {
    id: number;
    reference: string;
    name: string;
    description: string;
    client_id: number;
    status: string;
    start_date: string;
    end_date: string;
    estimated_duration: number;
    budget: number;
    actual_cost: number | null;
    notes?: string;
    clients?: any;
  }
  
  interface DocumentData {
    id: number;
    reference: string;
    type: string;
    status?: string;
    issue_date: string;
    due_date?: string;
    amount?: number;
    project_id?: number;
    client_id?: number;
    file_path?: string;
  }
  
  interface ScheduleItemData {
    id: string;
    title: string;
    type: 'event' | 'assignment';
    startTime: string;
    endTime?: string;
    allDay?: boolean;
    project?: { id: number; name: string } | null;
    stage?: { id: number; name: string } | null;
    eventType?: string;
  }
  
  interface StaffData {
    id: number;
    staff_id?: string;
    firstname: string;
    lastname: string;
    email: string;
    role_id: number;
    phone?: string;
    mobile?: string;
    address_id?: number;
    hire_date: string;
    is_available?: boolean;
  }
  
  interface ClientCardProps {
    client: ClientData;
    onPress?: (client: ClientData) => void;
  }
  
  interface ProjectCardProps {
    project: ProjectData;
    onPress?: (project: ProjectData) => void;
  }
  
  interface DocumentCardProps {
    document: DocumentData;
    onPress?: (document: DocumentData) => void;
  }
  
  interface ScheduleCardProps {
    scheduleItem: ScheduleItemData;
    onPress?: (scheduleItem: ScheduleItemData) => void;
  }
  
  interface DataCardsProps {
    data: any[];
    format: string;
    title?: string;
    onItemPress?: (item: any) => void;
  }


export { ClientCardProps, ProjectCardProps, DocumentCardProps, ScheduleCardProps, DataCardsProps, ClientData, ProjectData, DocumentData, ScheduleItemData, StaffData };
