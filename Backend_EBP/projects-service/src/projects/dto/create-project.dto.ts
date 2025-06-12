import { IsString, IsOptional, IsNumber, IsDate, IsDateString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  Id: string;

  @IsString()
  @IsOptional()
  Caption?: string;

  @IsDateString()
  @IsOptional()
  DealDate?: Date;

  @IsNumber()
  @IsOptional()
  DealState?: number;

  @IsNumber()
  @IsOptional()
  PredictedCosts?: number;

  @IsNumber()
  @IsOptional()
  PredictedSales?: number;

  @IsNumber()
  @IsOptional()
  PredictedDuration?: number;

  @IsDateString()
  @IsOptional()
  xx_DateDebut?: Date;

  @IsDateString()
  @IsOptional()
  xx_DateFin?: Date;

  @IsString()
  @IsOptional()
  xx_Client?: string;

  @IsString()
  @IsOptional()
  xx_Commercial?: string;

  @IsString()
  @IsOptional()
  xx_Service?: string;

  @IsString()
  @IsOptional()
  xx_Origine_Vente?: string;

  @IsNumber()
  @IsOptional()
  xx_DureePrevue?: number;

  @IsString()
  @IsOptional()
  Notes?: string;

  @IsString()
  @IsOptional()
  NotesClear?: string;

  @IsString()
  @IsOptional()
  AnalyticAccounting_GridId?: string;
} 