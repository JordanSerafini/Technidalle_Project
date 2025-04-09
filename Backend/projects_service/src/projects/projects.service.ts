import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  // Projects
  async getAllProjects() {
    return await this.prisma.project.findMany({
      include: {
        stages: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async getProjectById(id: number) {
    return await this.prisma.project.findUnique({
      where: { id },
      include: {
        stages: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async createProject(data: Prisma.projectsCreateInput) {
    return await this.prisma.project.create({ data });
  }

  async updateProject(id: number, data: Prisma.projectsUpdateInput) {
    return await this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async deleteProject(id: number) {
    return await this.prisma.project.delete({
      where: { id },
    });
  }

  // Stages
  async getStagesByProjectId(projectId: number) {
    return await this.prisma.projectStage.findMany({
      where: { projectId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async createStage(projectId: number, data: Prisma.project_stagesCreateInput) {
    return await this.prisma.projectStage.create({
      data: {
        ...data,
        project: {
          connect: { id: projectId },
        },
      },
    });
  }

  async updateStage(id: number, data: Prisma.project_stagesUpdateInput) {
    return await this.prisma.projectStage.update({
      where: { id },
      data,
    });
  }

  async deleteStage(id: number) {
    return await this.prisma.projectStage.delete({
      where: { id },
    });
  }

  // Tags
  async getAllTags() {
    return await this.prisma.tag.findMany();
  }

  async addTagToProject(projectId: number, tagId: number): Promise<void> {
    await this.prisma.projectTag.create({
      data: {
        project: { connect: { id: projectId } },
        tag: { connect: { id: tagId } },
      },
    });
  }

  async removeTagFromProject(projectId: number, tagId: number): Promise<void> {
    await this.prisma.projectTag.delete({
      where: {
        projectId_tagId: {
          projectId,
          tagId,
        },
      },
    });
  }
}
