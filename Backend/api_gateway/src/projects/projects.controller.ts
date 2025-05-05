import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Injectable,
  Param,
  Post,
  Put,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
} from '../interfaces/project.interface';
import {
  Stage,
  CreateStageDto,
  UpdateStageDto,
} from '../interfaces/stage.interface';
import { Tag } from '../interfaces/tag.interface';
import {
  Address,
  ProjectAddress,
  CreateProjectAddressDto,
  UpdateProjectAddressDto,
} from '../interfaces/address.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
@Controller('projects')
export class ProjectsController {
  constructor(
    @Inject('PROJECTS_SERVICE') private readonly projectsService: ClientProxy,
    @Inject('CLIENTS_SERVICE') private readonly clientsService: ClientProxy,
  ) {}

  @Get()
  async getAllProjects(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('searchQuery') searchQuery?: string,
  ): Promise<Project[]> {
    if (!this.projectsService) {
      throw new HttpException(
        'Service non disponible',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    try {
      return await firstValueFrom(
        this.projectsService.send(
          { cmd: 'get_all_projects' },
          {
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
            searchQuery,
          },
        ),
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des projets:', error);
      throw new HttpException(
        'Erreur lors de la récupération des projets',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getProjectById(@Param('id') id: string): Promise<Project> {
    if (!this.projectsService) {
      throw new HttpException(
        'Service non disponible',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    try {
      const projectId = Number(id);
      if (isNaN(projectId)) {
        throw new HttpException(
          'ID de projet invalide',
          HttpStatus.BAD_REQUEST,
        );
      }
      return await firstValueFrom(
        this.projectsService.send(
          { cmd: 'get_project_by_id' },
          { id: projectId },
        ),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la récupération du projet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<Project> {
    return await firstValueFrom(
      this.projectsService.send({ cmd: 'create_project' }, createProjectDto),
    );
  }

  @Put(':id')
  async updateProject(
    @Param('id') id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    return await firstValueFrom(
      this.projectsService.send(
        { cmd: 'update_project' },
        { id: Number(id), projectDto: updateProjectDto },
      ),
    );
  }

  @Delete(':id')
  async deleteProject(@Param('id') id: number): Promise<boolean> {
    return await firstValueFrom(
      this.projectsService.send({ cmd: 'delete_project' }, { id: Number(id) }),
    );
  }

  @Get(':id/stages')
  async getStagesByProjectId(@Param('id') id: number): Promise<Stage[]> {
    return await firstValueFrom(
      this.projectsService.send(
        { cmd: 'get_stages_by_project_id' },
        { projectId: Number(id) },
      ),
    );
  }

  @Post(':id/stages')
  async createStage(
    @Param('id') id: number,
    @Body() createStageDto: CreateStageDto,
  ): Promise<Stage> {
    return await firstValueFrom(
      this.projectsService.send(
        { cmd: 'create_stage' },
        { projectId: Number(id), stageDto: createStageDto },
      ),
    );
  }

  @Put('stages/:id')
  async updateStage(
    @Param('id') id: number,
    @Body() updateStageDto: UpdateStageDto,
  ): Promise<Stage> {
    return await firstValueFrom(
      this.projectsService.send(
        { cmd: 'update_stage' },
        { id: Number(id), stageDto: updateStageDto },
      ),
    );
  }

  @Delete('stages/:id')
  async deleteStage(@Param('id') id: number): Promise<boolean> {
    return await firstValueFrom(
      this.projectsService.send({ cmd: 'delete_stage' }, { id: Number(id) }),
    );
  }

  @Get('tags')
  async getAllTags(): Promise<Tag[]> {
    return await firstValueFrom(
      this.projectsService.send({ cmd: 'get_all_tags' }, {}),
    );
  }

  @Post(':id/tags/:tagId')
  async addTagToProject(
    @Param('id') id: number,
    @Param('tagId') tagId: number,
  ): Promise<void> {
    return await firstValueFrom(
      this.projectsService.send(
        { cmd: 'add_tag_to_project' },
        { projectId: Number(id), tagId: Number(tagId) },
      ),
    );
  }

  @Delete(':id/tags/:tagId')
  async removeTagFromProject(
    @Param('id') id: number,
    @Param('tagId') tagId: number,
  ): Promise<void> {
    return await firstValueFrom(
      this.projectsService.send(
        { cmd: 'remove_tag_from_project' },
        { projectId: Number(id), tagId: Number(tagId) },
      ),
    );
  }

  @Get('client/:clientId')
  async getProjectsByClientId(
    @Param('clientId') clientId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<Project[]> {
    if (!this.projectsService) {
      throw new HttpException(
        'Service non disponible',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    try {
      const parsedClientId = Number(clientId);
      if (isNaN(parsedClientId)) {
        throw new HttpException(
          'ID de client invalide',
          HttpStatus.BAD_REQUEST,
        );
      }
      return await firstValueFrom(
        this.projectsService.send(
          { cmd: 'get_projects_by_client_id' },
          {
            clientId: parsedClientId,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
          },
        ),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error(
        'Erreur lors de la récupération des projets par client:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération des projets par client',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/addresses')
  async getProjectAddresses(@Param('id') id: number): Promise<Address[]> {
    try {
      return await firstValueFrom(
        this.clientsService.send(
          { cmd: 'get_project_addresses' },
          { projectId: Number(id) },
        ),
      );
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des adresses du projet:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération des adresses du projet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/project-addresses')
  async getProjectAddressAssociations(
    @Param('id') id: number,
  ): Promise<ProjectAddress[]> {
    try {
      return await firstValueFrom(
        this.clientsService.send(
          { cmd: 'get_project_addresses' },
          { projectId: Number(id) },
        ),
      );
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des associations projet-adresse:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération des associations projet-adresse',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('project-addresses/:id')
  async getProjectAddressById(
    @Param('id') id: number,
  ): Promise<ProjectAddress> {
    try {
      return await firstValueFrom(
        this.clientsService.send(
          { cmd: 'get_project_address_by_id' },
          { id: Number(id) },
        ),
      );
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'association projet-adresse:",
        error,
      );
      throw new HttpException(
        "Erreur lors de la récupération de l'association projet-adresse",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/project-addresses')
  async createProjectAddress(
    @Param('id') id: number,
    @Body() createProjectAddressDto: CreateProjectAddressDto,
  ): Promise<ProjectAddress> {
    try {
      const completeDto = {
        ...createProjectAddressDto,
        project_id: Number(id),
      };

      return await firstValueFrom(
        this.clientsService.send(
          { cmd: 'create_project_address' },
          completeDto,
        ),
      );
    } catch (error) {
      console.error(
        "Erreur lors de la création de l'association projet-adresse:",
        error,
      );
      throw new HttpException(
        "Erreur lors de la création de l'association projet-adresse",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('project-addresses/:id')
  async updateProjectAddress(
    @Param('id') id: number,
    @Body() updateProjectAddressDto: UpdateProjectAddressDto,
  ): Promise<ProjectAddress> {
    try {
      return await firstValueFrom(
        this.clientsService.send(
          { cmd: 'update_project_address' },
          { id: Number(id), projectAddressDto: updateProjectAddressDto },
        ),
      );
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de l'association projet-adresse:",
        error,
      );
      throw new HttpException(
        "Erreur lors de la mise à jour de l'association projet-adresse",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('project-addresses/:id')
  async deleteProjectAddress(@Param('id') id: number): Promise<boolean> {
    try {
      return await firstValueFrom(
        this.clientsService.send(
          { cmd: 'delete_project_address' },
          { id: Number(id) },
        ),
      );
    } catch (error) {
      console.error(
        "Erreur lors de la suppression de l'association projet-adresse:",
        error,
      );
      throw new HttpException(
        "Erreur lors de la suppression de l'association projet-adresse",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':projectId/project-addresses/:addressId/set-default')
  async setDefaultProjectAddress(
    @Param('projectId') projectId: number,
    @Param('addressId') addressId: number,
  ): Promise<boolean> {
    try {
      return await firstValueFrom(
        this.clientsService.send(
          { cmd: 'set_default_project_address' },
          { projectId: Number(projectId), addressId: Number(addressId) },
        ),
      );
    } catch (error) {
      console.error(
        "Erreur lors de la définition de l'adresse par défaut du projet:",
        error,
      );
      throw new HttpException(
        "Erreur lors de la définition de l'adresse par défaut du projet",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
