import {
  IsString,
  IsOptional,
  IsInt,
  IsISO8601,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Tag } from './project.interface';

export enum StageStatus {
  NON_COMMENCEE = 'non_commencee',
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
  status: StageStatus;
  orderIndex: number;
  estimatedDuration?: number;
  actualDuration?: number;
  completionPercentage?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

export class CreateStageDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  projectId: number;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsEnum(StageStatus)
  status?: StageStatus = StageStatus.NON_COMMENCEE;

  @IsInt()
  orderIndex: number;

  @IsOptional()
  @IsInt()
  estimatedDuration?: number;

  @IsOptional()
  @IsInt()
  actualDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  completionPercentage?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStageDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  projectId?: number;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsEnum(StageStatus)
  status?: StageStatus;

  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @IsOptional()
  @IsInt()
  estimatedDuration?: number;

  @IsOptional()
  @IsInt()
  actualDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  completionPercentage?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
