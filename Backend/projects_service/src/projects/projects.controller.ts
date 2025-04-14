import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProjectsService } from './projects.service';
import { Prisma } from '../../generated/prisma';

@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @MessagePattern({ cmd: 'get_all_projects' })
  async getAllProjects(data?: {
    limit?: number;
    offset?: number;
    searchQuery?: string;
  }) {
    return this.projectsService.getAllProjects(
      data?.limit,
      data?.offset,
      data?.searchQuery,
    );
  }

  @MessagePattern({ cmd: 'get_project_by_id' })
  async getProjectById(data: { id: number }) {
    return this.projectsService.getProjectById(data.id);
  }

  @MessagePattern({ cmd: 'get_projects_by_client_id' })
  async getProjectsByClientId(data: {
    clientId: number;
    limit?: number;
    offset?: number;
  }) {
    return this.projectsService.getProjectsByClientId(
      data.clientId,
      data.limit,
      data.offset,
    );
  }

  @MessagePattern({ cmd: 'create_project' })
  async createProject(data: Prisma.projectsCreateInput) {
    return this.projectsService.createProject(data);
  }

  @MessagePattern({ cmd: 'update_project' })
  async updateProject(data: {
    id: number;
    projectDto: Prisma.projectsUpdateInput;
  }) {
    return this.projectsService.updateProject(data.id, data.projectDto);
  }

  @MessagePattern({ cmd: 'delete_project' })
  async deleteProject(data: { id: number }) {
    return this.projectsService.deleteProject(data.id);
  }

  @MessagePattern({ cmd: 'get_stages_by_project_id' })
  async getStagesByProjectId(data: { projectId: number }) {
    return this.projectsService.getStagesByProjectId(data.projectId);
  }

  @MessagePattern({ cmd: 'create_stage' })
  async createStage(data: {
    projectId: number;
    stageDto: Prisma.project_stagesCreateInput;
  }) {
    return this.projectsService.createStage(data.projectId, data.stageDto);
  }

  @MessagePattern({ cmd: 'update_stage' })
  async updateStage(data: {
    id: number;
    stageDto: Prisma.project_stagesUpdateInput;
  }) {
    return this.projectsService.updateStage(data.id, data.stageDto);
  }

  @MessagePattern({ cmd: 'delete_stage' })
  async deleteStage(data: { id: number }) {
    return this.projectsService.deleteStage(data.id);
  }

  @MessagePattern({ cmd: 'get_all_tags' })
  async getAllTags() {
    return this.projectsService.getAllTags();
  }

  @MessagePattern({ cmd: 'add_tag_to_project' })
  async addTagToProject(data: { projectId: number; tagId: number }) {
    return this.projectsService.addTagToProject(data.projectId, data.tagId);
  }

  @MessagePattern({ cmd: 'remove_tag_from_project' })
  async removeTagFromProject(data: { projectId: number; tagId: number }) {
    return this.projectsService.removeTagFromProject(
      data.projectId,
      data.tagId,
    );
  }
}
