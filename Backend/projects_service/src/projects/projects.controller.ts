import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProjectsService } from './projects.service';
import { Prisma } from '@prisma/client';

@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // Projects
  @MessagePattern({ cmd: 'get_all_projects' })
  getAllProjects() {
    return this.projectsService.getAllProjects();
  }

  @MessagePattern({ cmd: 'get_project_by_id' })
  getProjectById(@Payload() data: { id: number }) {
    return this.projectsService.getProjectById(Number(data.id));
  }

  @MessagePattern({ cmd: 'create_project' })
  createProject(@Payload() data: Prisma.ProjectCreateInput) {
    return this.projectsService.createProject(data);
  }

  @MessagePattern({ cmd: 'update_project' })
  updateProject(
    @Payload() data: { id: number; projectDto: Prisma.ProjectUpdateInput },
  ) {
    return this.projectsService.updateProject(Number(data.id), data.projectDto);
  }

  @MessagePattern({ cmd: 'delete_project' })
  deleteProject(@Payload() data: { id: number }) {
    return this.projectsService.deleteProject(Number(data.id));
  }

  // Stages
  @MessagePattern({ cmd: 'get_stages_by_project_id' })
  getStagesByProjectId(@Payload() data: { projectId: number }) {
    return this.projectsService.getStagesByProjectId(Number(data.projectId));
  }

  @MessagePattern({ cmd: 'create_stage' })
  createStage(
    @Payload()
    data: {
      projectId: number;
      stageDto: Prisma.ProjectStageCreateInput;
    },
  ) {
    return this.projectsService.createStage(
      Number(data.projectId),
      data.stageDto,
    );
  }

  @MessagePattern({ cmd: 'update_stage' })
  updateStage(
    @Payload() data: { id: number; stageDto: Prisma.ProjectStageUpdateInput },
  ) {
    return this.projectsService.updateStage(Number(data.id), data.stageDto);
  }

  @MessagePattern({ cmd: 'delete_stage' })
  deleteStage(@Payload() data: { id: number }) {
    return this.projectsService.deleteStage(Number(data.id));
  }

  // Tags
  @MessagePattern({ cmd: 'get_all_tags' })
  getAllTags() {
    return this.projectsService.getAllTags();
  }

  @MessagePattern({ cmd: 'add_tag_to_project' })
  addTagToProject(@Payload() data: { projectId: number; tagId: number }) {
    return this.projectsService.addTagToProject(
      Number(data.projectId),
      Number(data.tagId),
    );
  }

  @MessagePattern({ cmd: 'remove_tag_from_project' })
  removeTagFromProject(@Payload() data: { projectId: number; tagId: number }) {
    return this.projectsService.removeTagFromProject(
      Number(data.projectId),
      Number(data.tagId),
    );
  }
}
