import {
  IsString,
  IsOptional,
  IsInt,
  IsISO8601,
  IsEnum,
  IsDecimal,
  Min,
  Max,
} from 'class-validator';

export enum ProjectStatus {
  PROSPECT = 'prospect',
  DEVIS_EN_COURS = 'devis_en_cours',
  DEVIS_ACCEPTE = 'devis_accepte',
  EN_PREPARATION = 'en_preparation',
  EN_COURS = 'en_cours',
  EN_PAUSE = 'en_pause',
  TERMINE = 'termine',
  ANNULE = 'annule',
}

export interface Stage {
  id: number;
  name: string;
  description?: string;
  projectId: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  orderIndex: number;
  estimatedDuration?: number;
  actualDuration?: number;
  completionPercentage?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  reference: string;
  name: string;
  description?: string;
  clientId: number;
  addressId?: number;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  estimatedDuration?: number;
  budget?: number;
  actualCost?: number;
  margin?: number;
  priority?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  stages?: Stage[];
  tags?: Tag[];
  client?: any;
  address?: any;
}

export class CreateProjectDto {
  @IsString()
  reference: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  clientId: number;

  @IsOptional()
  @IsInt()
  addressId?: number;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus = ProjectStatus.PROSPECT;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsInt()
  estimatedDuration?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  budget?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  actualCost?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  margin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  clients?: any;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsOptional()
  @IsInt()
  addressId?: number;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsInt()
  estimatedDuration?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  budget?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  actualCost?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  margin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
