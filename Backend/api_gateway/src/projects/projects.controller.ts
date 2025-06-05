import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
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

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    @Inject('PROJECTS_SERVICE') private readonly projectsService: ClientProxy,
    @Inject('CLIENTS_SERVICE') private readonly clientsService: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liste des projets' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'searchQuery', required: false, type: String })
  @ApiOkResponse({ description: 'Liste des projets' })
  async getAllProjects(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('searchQuery') searchQuery?: string,
  ): Promise<Project[]> {
    return firstValueFrom(
      this.projectsService.send(
        { cmd: 'get_all_projects' },
        {
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined,
          searchQuery,
        },
      ),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'D\u00e9tails d\'un projet' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Projet trouv\u00e9' })
  async getProjectById(@Param('id', ParseIntPipe) id: number): Promise<Project> {
    return firstValueFrom(
      this.projectsService.send(
        { cmd: 'get_project_by_id' },
        { id },
      ),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Cr\u00e9er un projet' })
  @ApiBody({ type: CreateProjectDto })
  @ApiCreatedResponse({ description: 'Projet cr\u00e9\u00e9' })
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<Project> {
    return firstValueFrom(
      this.projectsService.send({ cmd: 'create_project' }, createProjectDto),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre \u00e0 jour un projet' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateProjectDto })
  @ApiOkResponse({ description: 'Projet mis \u00e0 jour' })
  async updateProject(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    return firstValueFrom(
      this.projectsService.send(
        { cmd: 'update_project' },
        { id, projectDto: updateProjectDto },
      ),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un projet' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse({ description: 'Projet supprim\u00e9' })
  async deleteProject(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return firstValueFrom(
      this.projectsService.send({ cmd: 'delete_project' }, { id }),
    );
  }

  @Get(':id/stages')
  async getStagesByProjectId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Stage[]> {
    return firstValueFrom(
      this.projectsService.send(
        { cmd: 'get_stages_by_project_id' },
        { projectId: id },
      ),
    );
  }

  @Post(':id/stages')
  async createStage(
    @Param('id', ParseIntPipe) id: number,
    @Body() createStageDto: CreateStageDto,
  ): Promise<Stage> {
    return firstValueFrom(
      this.projectsService.send(
        { cmd: 'create_stage' },
        { projectId: id, stageDto: createStageDto },
      ),
    );
  }

  @Put('stages/:id')
  async updateStage(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStageDto: UpdateStageDto,
  ): Promise<Stage> {
    return firstValueFrom(
      this.projectsService.send(
        { cmd: 'update_stage' },
        { id, stageDto: updateStageDto },
      ),
    );
  }

  @Delete('stages/:id')
  async deleteStage(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return firstValueFrom(
      this.projectsService.send({ cmd: 'delete_stage' }, { id }),
    );
  }

  @Get('tags')
  async getAllTags(): Promise<Tag[]> {
    return firstValueFrom(
      this.projectsService.send({ cmd: 'get_all_tags' }, {}),
    );
  }

  @Post(':id/tags/:tagId')
  async addTagToProject(
    @Param('id', ParseIntPipe) id: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ): Promise<void> {
    return firstValueFrom(
      this.projectsService.send(
        { cmd: 'add_tag_to_project' },
        { projectId: id, tagId },
      ),
    );
  }

  @Delete(':id/tags/:tagId')
  async removeTagFromProject(
    @Param('id', ParseIntPipe) id: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ): Promise<void> {
    return firstValueFrom(
      this.projectsService.send(
        { cmd: 'remove_tag_from_project' },
        { projectId: id, tagId },
      ),
    );
  }

  @Get('client/:clientId')
  async getProjectsByClientId(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<Project[]> {
    return firstValueFrom(
      this.projectsService.send(
        { cmd: 'get_projects_by_client_id' },
        {
          clientId,
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined,
        },
      ),
    );
  }

  @Get(':id/addresses')
  async getProjectAddresses(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Address[]> {
    return firstValueFrom(
      this.clientsService.send(
        { cmd: 'get_project_addresses' },
        { projectId: id },
      ),
    );
  }

  @Get(':id/project-addresses')
  async getProjectAddressAssociations(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProjectAddress[]> {
    return firstValueFrom(
      this.clientsService.send(
        { cmd: 'get_project_addresses' },
        { projectId: id },
      ),
    );
  }

  @Get('project-addresses/:id')
  async getProjectAddressById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProjectAddress> {
    return firstValueFrom(
      this.clientsService.send(
        { cmd: 'get_project_address_by_id' },
        { id },
      ),
    );
  }

  @Post(':id/project-addresses')
  async createProjectAddress(
    @Param('id', ParseIntPipe) id: number,
    @Body() createProjectAddressDto: CreateProjectAddressDto,
  ): Promise<ProjectAddress> {
    const completeDto = {
      ...createProjectAddressDto,
      project_id: id,
    };

    return firstValueFrom(
      this.clientsService.send(
        { cmd: 'create_project_address' },
        completeDto,
      ),
    );
  }

  @Put('project-addresses/:id')
  async updateProjectAddress(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectAddressDto: UpdateProjectAddressDto,
  ): Promise<ProjectAddress> {
    return firstValueFrom(
      this.clientsService.send(
        { cmd: 'update_project_address' },
        { id, projectAddressDto: updateProjectAddressDto },
      ),
    );
  }

  @Delete('project-addresses/:id')
  async deleteProjectAddress(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return firstValueFrom(
      this.clientsService.send(
        { cmd: 'delete_project_address' },
        { id },
      ),
    );
  }

  @Put(':projectId/project-addresses/:addressId/set-default')
  async setDefaultProjectAddress(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('addressId', ParseIntPipe) addressId: number,
  ): Promise<boolean> {
    return firstValueFrom(
      this.clientsService.send(
        { cmd: 'set_default_project_address' },
        { projectId, addressId },
      ),
    );
  }
}
