import { ApiProperty } from '@nestjs/swagger';

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

export class CreateAddressDto {
  @ApiProperty({ required: false })
  street_number?: string;

  @ApiProperty({ required: true })
  street_name: string;

  @ApiProperty({ required: false })
  additional_address?: string;

  @ApiProperty({ required: true })
  zip_code: string;

  @ApiProperty({ required: true })
  city: string;

  @ApiProperty({ required: false })
  country?: string;

  @ApiProperty({ required: false })
  latitude?: number;

  @ApiProperty({ required: false })
  longitude?: number;
}

export class UpdateAddressDto {
  @ApiProperty({ required: false })
  street_number?: string;

  @ApiProperty({ required: false })
  street_name?: string;

  @ApiProperty({ required: false })
  additional_address?: string;

  @ApiProperty({ required: false })
  zip_code?: string;

  @ApiProperty({ required: false })
  city?: string;

  @ApiProperty({ required: false })
  country?: string;

  @ApiProperty({ required: false })
  latitude?: number;

  @ApiProperty({ required: false })
  longitude?: number;
}

export class CreateClientAddressDto {
  @ApiProperty({ required: false })
  client_id?: number;

  @ApiProperty({ required: false })
  address_id?: number;

  @ApiProperty({ required: false, type: CreateAddressDto })
  address?: CreateAddressDto;

  @ApiProperty({ required: true, enum: AddressType })
  address_type: AddressType;

  @ApiProperty({ required: false })
  is_default?: boolean;

  @ApiProperty({ required: false })
  notes?: string;
}

export class UpdateClientAddressDto {
  @ApiProperty({ required: false, enum: AddressType })
  address_type?: AddressType;

  @ApiProperty({ required: false })
  is_default?: boolean;

  @ApiProperty({ required: false })
  notes?: string;
}

export class CreateProjectAddressDto {
  @ApiProperty({ required: false })
  project_id?: number;

  @ApiProperty({ required: false })
  address_id?: number;

  @ApiProperty({ required: false, type: CreateAddressDto })
  address?: CreateAddressDto;

  @ApiProperty({ required: true, enum: AddressType })
  address_type: AddressType;

  @ApiProperty({ required: false })
  is_default?: boolean;

  @ApiProperty({ required: false })
  notes?: string;
}

export class UpdateProjectAddressDto {
  @ApiProperty({ required: false, enum: AddressType })
  address_type?: AddressType;

  @ApiProperty({ required: false })
  is_default?: boolean;

  @ApiProperty({ required: false })
  notes?: string;
}
