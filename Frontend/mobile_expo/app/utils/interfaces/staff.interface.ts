import React from 'react';

export interface Staff {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role_id: number;
  phone?: string;
  mobile?: string;
  address_id?: number;
  hire_date: Date;
  is_available?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProjectStaff {
  id: number;
  project_id: number;
  staff_id: number;
  stage_id?: number;
  role_description?: string;
  start_date: Date;
  end_date?: Date;
  hours_planned?: number;
  hours_worked?: number;
  created_at?: Date;
  updated_at?: Date;
  staff?: Staff;
}

// Composant React pour résoudre l'erreur de routing Expo
export default function StaffInterfaceComponent() {
  return React.createElement(React.Fragment, null);
}

