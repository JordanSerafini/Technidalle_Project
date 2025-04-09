import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  Material,
  CreateMaterialDto,
  UpdateMaterialDto,
  ProjectMaterial,
  CreateProjectMaterialDto,
  UpdateProjectMaterialDto,
} from '../interfaces/material.interface';
import {
  ProjectStaff,
  CreateProjectStaffDto,
  UpdateProjectStaffDto,
} from '../interfaces/staff.interface';

@Controller('resources')
export class ResourcesController {
  constructor(
    @Inject('RESOURCES_SERVICE') private readonly resourcesService: ClientProxy,
  ) {}

  /* Materials Endpoints */
  @Get('materials')
  async getAllMaterials(): Promise<Material[]> {
    if (!this.resourcesService) {
      throw new HttpException(
        'Service non disponible',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    try {
      return await firstValueFrom(
        this.resourcesService.send({ cmd: 'get_all_materials' }, {}),
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des matériaux:', error);
      throw new HttpException(
        'Erreur lors de la récupération des matériaux',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('materials/:id')
  async getMaterialById(@Param('id') id: string): Promise<Material> {
    try {
      return await firstValueFrom(
        this.resourcesService.send({ cmd: 'get_material_by_id' }, { id }),
      );
    } catch (error) {
      console.error('Erreur lors de la récupération du matériau:', error);
      throw new HttpException(
        'Erreur lors de la récupération du matériau',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('materials')
  async createMaterial(
    @Body() createMaterialDto: CreateMaterialDto,
  ): Promise<Material> {
    try {
      return await firstValueFrom(
        this.resourcesService.send(
          { cmd: 'create_material' },
          createMaterialDto,
        ),
      );
    } catch (error) {
      console.error('Erreur lors de la création du matériau:', error);
      throw new HttpException(
        'Erreur lors de la création du matériau',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('materials/:id')
  async updateMaterial(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ): Promise<Material> {
    try {
      return await firstValueFrom(
        this.resourcesService.send(
          { cmd: 'update_material' },
          { id, materialDto: updateMaterialDto },
        ),
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du matériau:', error);
      throw new HttpException(
        'Erreur lors de la mise à jour du matériau',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('materials/:id')
  async deleteMaterial(@Param('id') id: string): Promise<boolean> {
    try {
      return await firstValueFrom(
        this.resourcesService.send({ cmd: 'delete_material' }, { id }),
      );
    } catch (error) {
      console.error('Erreur lors de la suppression du matériau:', error);
      throw new HttpException(
        'Erreur lors de la suppression du matériau',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* Project Materials Endpoints */
  @Get('projects/:id/materials')
  async getProjectMaterials(
    @Param('id') id: string,
  ): Promise<ProjectMaterial[]> {
    try {
      return await firstValueFrom(
        this.resourcesService.send(
          { cmd: 'get_project_materials' },
          { projectId: id },
        ),
      );
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des matériaux du projet:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération des matériaux du projet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('projects/:id/materials')
  async addMaterialToProject(
    @Param('id') id: string,
    @Body() createProjectMaterialDto: CreateProjectMaterialDto,
  ): Promise<ProjectMaterial> {
    try {
      return await firstValueFrom(
        this.resourcesService.send(
          { cmd: 'add_material_to_project' },
          { projectId: id, materialDto: createProjectMaterialDto },
        ),
      );
    } catch (error) {
      console.error("Erreur lors de l'ajout du matériau au projet:", error);
      throw new HttpException(
        "Erreur lors de l'ajout du matériau au projet",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('projects/:projectId/materials/:materialId')
  async updateProjectMaterial(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
    @Body() updateProjectMaterialDto: UpdateProjectMaterialDto,
  ): Promise<ProjectMaterial> {
    try {
      return await firstValueFrom(
        this.resourcesService.send(
          { cmd: 'update_project_material' },
          {
            projectId,
            materialId,
            materialDto: updateProjectMaterialDto,
          },
        ),
      );
    } catch (error) {
      console.error(
        'Erreur lors de la mise à jour du matériau du projet:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la mise à jour du matériau du projet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('projects/:projectId/materials/:materialId')
  async removeMaterialFromProject(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
  ): Promise<boolean> {
    try {
      return await firstValueFrom(
        this.resourcesService.send(
          { cmd: 'remove_material_from_project' },
          { projectId, materialId },
        ),
      );
    } catch (error) {
      console.error(
        'Erreur lors de la suppression du matériau du projet:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la suppression du matériau du projet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* Project Staff Endpoints */
  @Get('projects/:id/staff')
  async getProjectStaff(@Param('id') id: string): Promise<ProjectStaff[]> {
    try {
      return await firstValueFrom(
        this.resourcesService.send(
          { cmd: 'get_project_staff' },
          { projectId: id },
        ),
      );
    } catch (error) {
      console.error(
        'Erreur lors de la récupération du personnel du projet:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération du personnel du projet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('projects/:id/staff')
  async addStaffToProject(
    @Param('id') id: string,
    @Body() createProjectStaffDto: CreateProjectStaffDto,
  ): Promise<ProjectStaff> {
    try {
      return await firstValueFrom(
        this.resourcesService.send(
          { cmd: 'add_staff_to_project' },
          { projectId: id, staffDto: createProjectStaffDto },
        ),
      );
    } catch (error) {
      console.error("Erreur lors de l'ajout du personnel au projet:", error);
      throw new HttpException(
        "Erreur lors de l'ajout du personnel au projet",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('projects/:projectId/staff/:staffId')
  async updateProjectStaff(
    @Param('projectId') projectId: string,
    @Param('staffId') staffId: string,
    @Body() updateProjectStaffDto: UpdateProjectStaffDto,
  ): Promise<ProjectStaff> {
    try {
      return await firstValueFrom(
        this.resourcesService.send(
          { cmd: 'update_project_staff' },
          {
            projectId,
            staffId,
            staffDto: updateProjectStaffDto,
          },
        ),
      );
    } catch (error) {
      console.error(
        'Erreur lors de la mise à jour du personnel du projet:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la mise à jour du personnel du projet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('projects/:projectId/staff/:staffId')
  async removeStaffFromProject(
    @Param('projectId') projectId: string,
    @Param('staffId') staffId: string,
  ): Promise<boolean> {
    try {
      return await firstValueFrom(
        this.resourcesService.send(
          { cmd: 'remove_staff_from_project' },
          { projectId, staffId },
        ),
      );
    } catch (error) {
      console.error(
        'Erreur lors de la suppression du personnel du projet:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la suppression du personnel du projet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
