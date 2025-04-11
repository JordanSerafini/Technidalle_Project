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
  id?: number;
  company_name?: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  mobile?: string;
  address_id?: number;
  siret?: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  addresses?: Address;
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