import React from 'react';

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

// Composant React pour résoudre l'erreur de routing Expo
export default function AddressInterfaceComponent() {
  return React.createElement(React.Fragment, null);
}
