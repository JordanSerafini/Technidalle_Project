export enum AddressType {
  FACTURATION = 'facturation',
  LIVRAISON = 'livraison',
  SIEGE_SOCIAL = 'siège_social',
  CHANTIER = 'chantier',
  DOMICILE = 'domicile',
  AUTRE = 'autre',
}

export interface Address {
  id?: number;
  street_number?: string;
  street_name: string;
  additional_address?: string;
  zip_code: string;
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ClientAddress {
  id?: number;
  client_id: number;
  address_id: number;
  address_type: AddressType;
  is_default: boolean;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  address?: Address;
}

export interface ProjectAddress {
  id?: number;
  project_id: number;
  address_id: number;
  address_type: AddressType;
  is_default: boolean;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  address?: Address;
}

export interface CreateAddressDto {
  street_number?: string;
  street_name: string;
  additional_address?: string;
  zip_code: string;
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateAddressDto {
  street_number?: string;
  street_name?: string;
  additional_address?: string;
  zip_code?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateClientAddressDto {
  client_id?: number;
  address_id?: number;
  address?: CreateAddressDto;
  address_type: AddressType;
  is_default?: boolean;
  notes?: string;
}

export interface UpdateClientAddressDto {
  address_type?: AddressType;
  is_default?: boolean;
  notes?: string;
}

export interface CreateProjectAddressDto {
  project_id?: number;
  address_id?: number;
  address?: CreateAddressDto;
  address_type: AddressType;
  is_default?: boolean;
  notes?: string;
}

export interface UpdateProjectAddressDto {
  address_type?: AddressType;
  is_default?: boolean;
  notes?: string;
}
