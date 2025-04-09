import { PartialType } from '@nestjs/swagger';
import { CreateProjectMaterialDto } from './create-project-material.dto';

export class UpdateProjectMaterialDto extends PartialType(
  CreateProjectMaterialDto,
) {}
