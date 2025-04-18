import React from 'react';

export interface Address {
  id: number;
  street_number?: string;
  street_name: string;
  additional_address?: string;
  zip_code: string;
  city: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface Client {
  id: string | number;
  firstname?: string;
  lastname?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  status?: string;
  notes?: string;
  addresses?: {
    street?: string;
    zipcode?: string;
    city?: string;
    country?: string;
  };
  orders?: any[];
  last_order_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateClientDto {
  company_name?: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  mobile?: string;
  address_id?: number;
  siret?: string;
  notes?: string;
}

export interface UpdateClientDto {
  company_name?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address_id?: number;
  siret?: string;
  notes?: string;
}

// Composant React pour résoudre l'erreur de routing Expo
export default function ClientInterfaceComponent() {
  return React.createElement(React.Fragment, null);
} 