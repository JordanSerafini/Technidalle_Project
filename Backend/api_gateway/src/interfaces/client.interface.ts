import { ApiProperty } from '@nestjs/swagger';

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

export class CreateClientDto {
  @ApiProperty({ required: false, description: "Nom de la soci\u00e9t\u00e9" })
  company_name?: string;

  @ApiProperty({ description: "Pr\u00e9nom du client" })
  firstname: string;

  @ApiProperty({ description: "Nom du client" })
  lastname: string;

  @ApiProperty({ description: "Adresse email" })
  email: string;

  @ApiProperty({ required: false, description: "T\u00e9l\u00e9phone" })
  phone?: string;

  @ApiProperty({ required: false, description: "Mobile" })
  mobile?: string;

  @ApiProperty({ required: false, description: "Identifiant d'adresse" })
  address_id?: number;

  @ApiProperty({ required: false, description: "SIRET" })
  siret?: string;

  @ApiProperty({ required: false, description: "Notes diverses" })
  notes?: string;
}

export class UpdateClientDto {
  @ApiProperty({ required: false, description: "Nom de la soci\u00e9t\u00e9" })
  company_name?: string;

  @ApiProperty({ required: false, description: "Pr\u00e9nom du client" })
  firstname?: string;

  @ApiProperty({ required: false, description: "Nom du client" })
  lastname?: string;

  @ApiProperty({ required: false, description: "Adresse email" })
  email?: string;

  @ApiProperty({ required: false, description: "T\u00e9l\u00e9phone" })
  phone?: string;

  @ApiProperty({ required: false, description: "Mobile" })
  mobile?: string;

  @ApiProperty({ required: false, description: "Identifiant d'adresse" })
  address_id?: number;

  @ApiProperty({ required: false, description: "SIRET" })
  siret?: string;

  @ApiProperty({ required: false, description: "Notes diverses" })
  notes?: string;
}

export class CreateClientWithAddressDto {
  @ApiProperty({ required: false, description: "Nom de la soci\u00e9t\u00e9" })
  company_name?: string;

  @ApiProperty({ required: false, description: "Pr\u00e9nom" })
  firstname?: string;

  @ApiProperty({ required: false, description: "Nom" })
  lastname?: string;

  @ApiProperty({ description: "Email" })
  email: string;

  @ApiProperty({ required: false, description: "T\u00e9l\u00e9phone" })
  phone?: string;

  @ApiProperty({ required: false, description: "Mobile" })
  mobile?: string;

  @ApiProperty({ required: false, description: "SIRET" })
  siret?: string;

  @ApiProperty({ required: false, description: "Notes" })
  notes?: string;

  @ApiProperty({ description: "Adresse" })
  address: {
    street_number: string;
    street_name: string;
    additional_address?: string;
    zip_code: string;
    city: string;
    country: string;
  };
}
