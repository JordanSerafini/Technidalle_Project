import { Module } from '@nestjs/common';
import { ProjectMaterialsController } from './project-materials.controller';
import { ProjectMaterialsService } from './project-materials.service';
import { MaterialsModule } from '../materials/materials.module';

@Module({
  imports: [MaterialsModule],
  controllers: [ProjectMaterialsController],
  providers: [ProjectMaterialsService],
})
export class ProjectMaterialsModule {}
