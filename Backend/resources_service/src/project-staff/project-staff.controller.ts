import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { ProjectStaffService } from './project-staff.service';
import { CreateProjectStaffDto } from './dto/create-project-staff.dto';
import { UpdateProjectStaffDto } from './dto/update-project-staff.dto';

@ApiTags('project-staff')
@Controller()
export class ProjectStaffController {
  constructor(private readonly projectStaffService: ProjectStaffService) {}

  @MessagePattern({ cmd: 'get_all_staff' })
  async getAllStaff(data: {
    limit?: number;
    offset?: number;
    searchQuery?: string;
  }) {
    return this.projectStaffService.findAll(
      data.limit,
      data.offset,
      data.searchQuery,
    );
  }

  @MessagePattern({ cmd: 'get_project_staff' })
  async getProjectStaff(data: { projectId: string }) {
    return this.projectStaffService.findAllByProjectId(data.projectId);
  }

  @MessagePattern({ cmd: 'get_project_staff_member' })
  async getProjectStaffMember(data: { projectId: string; staffId: string }) {
    return this.projectStaffService.findOne(data.projectId, data.staffId);
  }

  @MessagePattern({ cmd: 'add_staff_to_project' })
  async addStaffToProject(data: {
    projectId: string;
    staffDto: CreateProjectStaffDto;
  }) {
    return this.projectStaffService.create(data.projectId, data.staffDto);
  }

  @MessagePattern({ cmd: 'update_project_staff' })
  async updateProjectStaff(data: {
    projectId: string;
    staffId: string;
    staffDto: UpdateProjectStaffDto;
  }) {
    return this.projectStaffService.update(
      data.projectId,
      data.staffId,
      data.staffDto,
    );
  }

  @MessagePattern({ cmd: 'remove_staff_from_project' })
  async removeStaffFromProject(data: { projectId: string; staffId: string }) {
    return this.projectStaffService.remove(data.projectId, data.staffId);
  }
}
