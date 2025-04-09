import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Prisma } from '../../generated/prisma';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getAllProjects() {
    return this.projectsService.getAllProjects();
  }

  @Get(':id')
  async getProjectById(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.getProjectById(id);
  }

  @Post()
  async createProject(@Body() data: Prisma.projectsCreateInput) {
    return this.projectsService.createProject(data);
  }

  @Put(':id')
  async updateProject(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Prisma.projectsUpdateInput,
  ) {
    return this.projectsService.updateProject(id, data);
  }

  @Delete(':id')
  async deleteProject(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.deleteProject(id);
  }

  @Get(':projectId/stages')
  async getStagesByProjectId(
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.projectsService.getStagesByProjectId(projectId);
  }

  @Post(':projectId/stages')
  async createStage(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() data: Prisma.project_stagesCreateInput,
  ) {
    return this.projectsService.createStage(projectId, data);
  }

  @Put(':projectId/stages/:stageId')
  async updateStage(
    @Param('stageId', ParseIntPipe) stageId: number,
    @Body() data: Prisma.project_stagesUpdateInput,
  ) {
    return this.projectsService.updateStage(stageId, data);
  }

  @Delete(':projectId/stages/:stageId')
  async deleteStage(@Param('stageId', ParseIntPipe) stageId: number) {
    return this.projectsService.deleteStage(stageId);
  }

  @Get('tags')
  async getAllTags() {
    return this.projectsService.getAllTags();
  }

  @Post(':projectId/tags/:tagId')
  async addTagToProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ) {
    return this.projectsService.addTagToProject(projectId, tagId);
  }

  @Delete(':projectId/tags/:tagId')
  async removeTagFromProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ) {
    return this.projectsService.removeTagFromProject(projectId, tagId);
  }
}
