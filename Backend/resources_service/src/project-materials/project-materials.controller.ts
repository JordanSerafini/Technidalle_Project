import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProjectMaterialsService } from './project-materials.service';
import { CreateProjectMaterialDto } from './dto/create-project-material.dto';
import { UpdateProjectMaterialDto } from './dto/update-project-material.dto';

@Controller()
export class ProjectMaterialsController {
  constructor(
    private readonly projectMaterialsService: ProjectMaterialsService,
  ) {}

  @MessagePattern({ cmd: 'get_project_materials' })
  async getProjectMaterials(data: { projectId: string }) {
    return this.projectMaterialsService.findAllByProjectId(data.projectId);
  }

  @MessagePattern({ cmd: 'get_project_material' })
  async getProjectMaterial(data: { projectId: string; materialId: string }) {
    return this.projectMaterialsService.findOne(
      data.projectId,
      data.materialId,
    );
  }

  @MessagePattern({ cmd: 'add_material_to_project' })
  async addMaterialToProject(data: {
    projectId: string;
    materialDto: CreateProjectMaterialDto;
  }) {
    return this.projectMaterialsService.create(
      data.projectId,
      data.materialDto,
    );
  }

  @MessagePattern({ cmd: 'update_project_material' })
  async updateProjectMaterial(data: {
    projectId: string;
    materialId: string;
    materialDto: UpdateProjectMaterialDto;
  }) {
    return this.projectMaterialsService.update(
      data.projectId,
      data.materialId,
      data.materialDto,
    );
  }

  @MessagePattern({ cmd: 'remove_material_from_project' })
  async removeMaterialFromProject(data: {
    projectId: string;
    materialId: string;
  }) {
    return this.projectMaterialsService.remove(data.projectId, data.materialId);
  }
}
