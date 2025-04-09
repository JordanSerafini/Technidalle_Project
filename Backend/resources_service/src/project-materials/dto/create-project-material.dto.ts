import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectMaterialDto {
  @ApiProperty({ description: 'ID du matériau' })
  materialId: string;

  @ApiProperty({ description: 'Quantité prévue' })
  quantity: number;
} 