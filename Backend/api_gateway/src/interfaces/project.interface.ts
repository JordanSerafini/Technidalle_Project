import { IsString, IsOptional, IsInt, IsISO8601 } from 'class-validator';
import { Stage } from './stage.interface';
import { Tag } from './tag.interface';

export interface Project {
  id: number;
  name: string;
  description?: string;
  clientId?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  stages?: Stage[];
  tags?: Tag[];
}

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;
}

export class UpdateProjectDto {
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
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
