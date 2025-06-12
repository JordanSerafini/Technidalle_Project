import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // REST Endpoints pour API Gateway
  @Get()
  async findAll(@Query() query: any) {
    return this.projectsService.findAll(query);
  }

  @Get('active')
  async findActiveProjects() {
    return this.projectsService.findActiveProjects();
  }

  @Get('stats')
  async getStats() {
    return this.projectsService.getProjectStats();
  }

  @Get('over-budget')
  async findProjectsOverBudget() {
    return this.projectsService.findProjectsOverBudget();
  }

  @Get('near-deadline')
  async findProjectsNearDeadline(@Query('days') days?: number) {
    return this.projectsService.findProjectsNearDeadline(days);
  }

  @Get('search')
  async search(@Query('q') searchTerm: string) {
    return this.projectsService.search(searchTerm);
  }

  @Get('by-commercial/:commercialId')
  async findByCommercial(@Param('commercialId') commercialId: string) {
    return this.projectsService.findByCommercial(commercialId);
  }

  @Get('by-client/:clientId')
  async findByClient(@Param('clientId') clientId: string) {
    return this.projectsService.findByClient(clientId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get(':id/sites')
  async getConstructionSites(@Param('id') id: string) {
    return this.projectsService.getConstructionSites(id);
  }

  @Get(':id/team')
  async getProjectTeam(@Param('id') id: string) {
    return this.projectsService.getProjectTeam(id);
  }

  @Get(':id/suppliers')
  async getProjectSuppliers(@Param('id') id: string) {
    return this.projectsService.getProjectSuppliers(id);
  }

  @Get(':id/items')
  async getProjectItems(@Param('id') id: string) {
    return this.projectsService.getProjectItems(id);
  }

  @Post()
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Patch(':id/progress')
  async updateProgress(@Param('id') id: string, @Body() progressData: any) {
    return this.projectsService.updateProgress(id, progressData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  // Microservice Message Patterns
  @MessagePattern('projects.findAll')
  async findAllMicroservice(@Payload() query: any) {
    return this.projectsService.findAll(query);
  }

  @MessagePattern('projects.findOne')
  async findOneMicroservice(@Payload() id: string) {
    return this.projectsService.findOne(id);
  }

  @MessagePattern('projects.findActive')
  async findActiveMicroservice() {
    return this.projectsService.findActiveProjects();
  }

  @MessagePattern('projects.findByCommercial')
  async findByCommercialMicroservice(@Payload() commercialId: string) {
    return this.projectsService.findByCommercial(commercialId);
  }

  @MessagePattern('projects.findByClient')
  async findByClientMicroservice(@Payload() clientId: string) {
    return this.projectsService.findByClient(clientId);
  }

  @MessagePattern('projects.search')
  async searchMicroservice(@Payload() searchTerm: string) {
    return this.projectsService.search(searchTerm);
  }

  @MessagePattern('projects.getStats')
  async getStatsMicroservice() {
    return this.projectsService.getProjectStats();
  }

  @MessagePattern('projects.findOverBudget')
  async findOverBudgetMicroservice() {
    return this.projectsService.findProjectsOverBudget();
  }

  @MessagePattern('projects.findNearDeadline')
  async findNearDeadlineMicroservice(@Payload() days: number) {
    return this.projectsService.findProjectsNearDeadline(days);
  }

  @MessagePattern('projects.getConstructionSites')
  async getConstructionSitesMicroservice(@Payload() dealId: string) {
    return this.projectsService.getConstructionSites(dealId);
  }

  @MessagePattern('projects.getTeam')
  async getTeamMicroservice(@Payload() dealId: string) {
    return this.projectsService.getProjectTeam(dealId);
  }

  @MessagePattern('projects.getSuppliers')
  async getSuppliersMicroservice(@Payload() dealId: string) {
    return this.projectsService.getProjectSuppliers(dealId);
  }

  @MessagePattern('projects.getItems')
  async getItemsMicroservice(@Payload() dealId: string) {
    return this.projectsService.getProjectItems(dealId);
  }

  @MessagePattern('projects.create')
  async createMicroservice(@Payload() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @MessagePattern('projects.update')
  async updateMicroservice(@Payload() data: { id: string; updateProjectDto: UpdateProjectDto }) {
    return this.projectsService.update(data.id, data.updateProjectDto);
  }

  @MessagePattern('projects.updateProgress')
  async updateProgressMicroservice(@Payload() data: { id: string; progressData: any }) {
    return this.projectsService.updateProgress(data.id, data.progressData);
  }

  @MessagePattern('projects.delete')
  async deleteMicroservice(@Payload() id: string) {
    return this.projectsService.remove(id);
  }
} 