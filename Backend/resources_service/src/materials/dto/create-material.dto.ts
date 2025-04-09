import { ApiProperty } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({ description: 'Nom du matériau' })
  name: string;

  @ApiProperty({ description: 'Description du matériau', required: false })
  description?: string;

  @ApiProperty({ description: 'Unité de mesure' })
  unit: string;

  @ApiProperty({ description: 'Prix unitaire' })
  unitPrice: number;
} 