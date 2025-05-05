export enum AddressType {
  FACTURATION = 'facturation',
  LIVRAISON = 'livraison',
  SIEGE_SOCIAL = 'siège_social',
  CHANTIER = 'chantier',
  DOMICILE = 'domicile',
  AUTRE = 'autre',
}

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

export interface ClientAddress {
  id: number;
  client_id: number;
  address_id: number;
  address_type: AddressType;
  is_default: boolean;
  notes?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  address?: Address;
}

export interface ProjectAddress {
  id: number;
  project_id: number;
  address_id: number;
  address_type: AddressType;
  is_default: boolean;
  notes?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  address?: Address;
}

export interface CreateAddressDto {
  street_number?: string | null;
  street_name: string;
  additional_address?: string | null;
  zip_code: string;
  city: string;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdateAddressDto {
  street_number?: string | null;
  street_name?: string;
  additional_address?: string | null;
  zip_code?: string;
  city?: string;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CreateClientAddressDto {
  client_id: number;
  address_id?: number;
  address?: CreateAddressDto;
  address_type: AddressType;
  is_default?: boolean;
  notes?: string | null;
}

export interface UpdateClientAddressDto {
  address_type?: AddressType;
  is_default?: boolean;
  notes?: string | null;
}

export interface CreateProjectAddressDto {
  project_id: number;
  address_id?: number;
  address?: CreateAddressDto;
  address_type: AddressType;
  is_default?: boolean;
  notes?: string | null;
}

export interface UpdateProjectAddressDto {
  address_type?: AddressType;
  is_default?: boolean;
  notes?: string | null;
}
