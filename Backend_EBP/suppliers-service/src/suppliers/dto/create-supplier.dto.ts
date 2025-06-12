import { IsString, IsOptional, IsNumber, IsBoolean, IsEmail } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  Id: string;

  @IsString()
  @IsOptional()
  Name?: string;

  @IsString()
  @IsOptional()
  Siren?: string;

  @IsString()
  @IsOptional()
  IntracommunityVATNumber?: string;

  @IsString()
  @IsOptional()
  NAF?: string;

  @IsString()
  @IsOptional()
  FamilyId?: string;

  @IsString()
  @IsOptional()
  SubFamilyId?: string;

  @IsString()
  @IsOptional()
  ColleagueId?: string;

  @IsNumber()
  @IsOptional()
  DiscountRate?: number;

  @IsNumber()
  @IsOptional()
  SecondDiscountRate?: number;

  @IsNumber()
  @IsOptional()
  AllowedAmount?: number;

  @IsString()
  @IsOptional()
  CurrencyId?: string;

  @IsString()
  @IsOptional()
  SettlementModeId?: string;

  @IsNumber()
  @IsOptional()
  PaymentDate?: number;

  // Adresse principale de facturation
  @IsString()
  @IsOptional()
  MainInvoicingAddress_Address1?: string;

  @IsString()
  @IsOptional()
  MainInvoicingAddress_Address2?: string;

  @IsString()
  @IsOptional()
  MainInvoicingAddress_ZipCode?: string;

  @IsString()
  @IsOptional()
  MainInvoicingAddress_City?: string;

  @IsString()
  @IsOptional()
  MainInvoicingAddress_CountryIsoCode?: string;

  @IsNumber()
  @IsOptional()
  MainInvoicingAddress_Longitude?: number;

  @IsNumber()
  @IsOptional()
  MainInvoicingAddress_Latitude?: number;

  // Contact principal de facturation
  @IsString()
  @IsOptional()
  MainInvoicingContact_Name?: string;

  @IsString()
  @IsOptional()
  MainInvoicingContact_FirstName?: string;

  @IsString()
  @IsOptional()
  MainInvoicingContact_Phone?: string;

  @IsString()
  @IsOptional()
  MainInvoicingContact_CellPhone?: string;

  @IsEmail()
  @IsOptional()
  MainInvoicingContact_Email?: string;

  @IsString()
  @IsOptional()
  MainInvoicingContact_Function?: string;

  // Adresse de livraison
  @IsString()
  @IsOptional()
  MainDeliveryAddress_Address1?: string;

  @IsString()
  @IsOptional()
  MainDeliveryAddress_Address2?: string;

  @IsString()
  @IsOptional()
  MainDeliveryAddress_ZipCode?: string;

  @IsString()
  @IsOptional()
  MainDeliveryAddress_City?: string;

  @IsString()
  @IsOptional()
  MainDeliveryAddress_CountryIsoCode?: string;

  // Contact de livraison
  @IsString()
  @IsOptional()
  MainDeliveryContact_Name?: string;

  @IsString()
  @IsOptional()
  MainDeliveryContact_Phone?: string;

  @IsEmail()
  @IsOptional()
  MainDeliveryContact_Email?: string;

  @IsBoolean()
  @IsOptional()
  UseInvoicingAddressAsDeliveryAddress?: boolean;

  @IsBoolean()
  @IsOptional()
  UseInvoicingContactAsDeliveryContact?: boolean;

  @IsString()
  @IsOptional()
  Notes?: string;

  @IsString()
  @IsOptional()
  NotesClear?: string;
} 