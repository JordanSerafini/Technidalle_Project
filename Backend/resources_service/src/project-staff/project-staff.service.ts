import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectStaffDto } from './dto/create-project-staff.dto';
import { UpdateProjectStaffDto } from './dto/update-project-staff.dto';

@Injectable()
export class ProjectStaffService {
  constructor(private prisma: PrismaService) {}

  async findAllByProjectId(projectId: string) {
    const projectIdNumber = parseInt(projectId);
    return await this.prisma.project_staff.findMany({
      where: { project_id: projectIdNumber },
      include: { staff: true },
    });
  }

  async findOne(projectId: string, staffId: string) {
    const projectIdNumber = parseInt(projectId);
    const staffIdNumber = parseInt(staffId);

    const projectStaff = await this.prisma.project_staff.findFirst({
      where: {
        AND: [{ project_id: projectIdNumber }, { staff_id: staffIdNumber }],
      },
      include: { staff: true },
    });

    if (!projectStaff) {
      throw new NotFoundException(
        `Personnel avec l'ID ${staffId} non trouvé pour le projet ${projectId}`,
      );
    }

    return projectStaff;
  }

  async create(
    projectId: string,
    createProjectStaffDto: CreateProjectStaffDto,
  ) {
    const projectIdNumber = parseInt(projectId);
    const staffIdNumber = parseInt(createProjectStaffDto.staffId);

    return await this.prisma.project_staff.create({
      data: {
        project_id: projectIdNumber,
        staff_id: staffIdNumber,
        role_description: createProjectStaffDto.role,
        start_date: createProjectStaffDto.startDate,
        end_date: createProjectStaffDto.endDate,
      },
      include: { staff: true },
    });
  }

  async update(
    projectId: string,
    staffId: string,
    updateProjectStaffDto: UpdateProjectStaffDto,
  ) {
    try {
      const projectIdNumber = parseInt(projectId);
      const staffIdNumber = parseInt(staffId);

      const data: any = {};

      if (updateProjectStaffDto.role) {
        data.role_description = updateProjectStaffDto.role;
      }

      if (updateProjectStaffDto.startDate) {
        data.start_date = updateProjectStaffDto.startDate;
      }

      if (updateProjectStaffDto.endDate) {
        data.end_date = updateProjectStaffDto.endDate;
      }

      return await this.prisma.project_staff.updateMany({
        where: {
          AND: [{ project_id: projectIdNumber }, { staff_id: staffIdNumber }],
        },
        data,
      });
    } catch (e) {
      console.log(e);
      throw new NotFoundException(
        `Personnel avec l'ID ${staffId} non trouvé pour le projet ${projectId}`,
      );
    }
  }

  async remove(projectId: string, staffId: string) {
    try {
      const projectIdNumber = parseInt(projectId);
      const staffIdNumber = parseInt(staffId);

      return await this.prisma.project_staff.deleteMany({
        where: {
          AND: [{ project_id: projectIdNumber }, { staff_id: staffIdNumber }],
        },
      });
    } catch (e) {
      console.log(e);
      throw new NotFoundException(
        `Personnel avec l'ID ${staffId} non trouvé pour le projet ${projectId}`,
      );
    }
  }
}
