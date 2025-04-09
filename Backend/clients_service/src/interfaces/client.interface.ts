export interface Address {
  id: number;
  street_number?: string | null;
  street_name: string;
  additional_address?: string | null;
  zip_code: string;
  city: string;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface Client {
  id: number;
  company_name?: string | null;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string | null;
  mobile?: string | null;
  address_id?: number | null;
  siret?: string | null;
  notes?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  addresses?: Address | null;
}

export interface CreateClientDto {
  company_name?: string | null;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string | null;
  mobile?: string | null;
  address_id?: number | null;
  siret?: string | null;
  notes?: string | null;
}

export interface UpdateClientDto {
  company_name?: string | null;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string | null;
  mobile?: string | null;
  address_id?: number | null;
  siret?: string | null;
  notes?: string | null;
}
