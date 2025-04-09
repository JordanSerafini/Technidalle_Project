import { IsString, IsOptional } from 'class-validator';

export interface Tag {
  id: number;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export class CreateTagDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateTagDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;
} 