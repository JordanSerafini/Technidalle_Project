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

export interface CreateClientWithAddressDto {
  company_name?: string;
  firstname?: string;
  lastname?: string;
  email: string;
  phone?: string;
  mobile?: string;
  siret?: string;
  notes?: string;
  address: {
    street_number: string;
    street_name: string;
    additional_address?: string;
    zip_code: string;
    city: string;
    country: string;
  };
}
