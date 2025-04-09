import { PartialType } from '@nestjs/swagger';
import { CreateProjectStaffDto } from './create-project-staff.dto';

export class UpdateProjectStaffDto extends PartialType(CreateProjectStaffDto) {} 