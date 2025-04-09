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
