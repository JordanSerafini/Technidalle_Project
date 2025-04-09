import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectStaffDto {
  @ApiProperty({ description: 'ID du membre du personnel' })
  staffId: string;

  @ApiProperty({ description: 'Rôle dans le projet' })
  role: string;

  @ApiProperty({ description: 'Date de début' })
  startDate: Date;

  @ApiProperty({ description: 'Date de fin (optionnelle)', required: false })
  endDate?: Date;
} 