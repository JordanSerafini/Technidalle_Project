import { IsString, IsOptional, IsEmail, IsBoolean, IsNumber, Length } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsString()
  @Length(14, 14)
  siret?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  customerFamilyId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @IsOptional()
  @IsString()
  notes?: string;
} 