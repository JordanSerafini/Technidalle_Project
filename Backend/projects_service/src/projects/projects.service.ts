import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Project, ProjectStage, Tag } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  // Projects
  async getAllProjects(): Promise<Project[]> {
    return this.prisma.project.findMany({
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

  async getProjectById(id: number): Promise<Project | null> {
    return this.prisma.project.findUnique({
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

  async createProject(data: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prisma.project.create({ data });
  }

  async updateProject(
    id: number,
    data: Prisma.ProjectUpdateInput,
  ): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async deleteProject(id: number): Promise<Project> {
    return this.prisma.project.delete({
      where: { id },
    });
  }

  // Stages
  async getStagesByProjectId(projectId: number): Promise<ProjectStage[]> {
    return this.prisma.projectStage.findMany({
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

  async createStage(
    projectId: number,
    data: Prisma.ProjectStageCreateInput,
  ): Promise<ProjectStage> {
    return this.prisma.projectStage.create({
      data: {
        ...data,
        project: {
          connect: { id: projectId },
        },
      },
    });
  }

  async updateStage(
    id: number,
    data: Prisma.ProjectStageUpdateInput,
  ): Promise<ProjectStage> {
    return this.prisma.projectStage.update({
      where: { id },
      data,
    });
  }

  async deleteStage(id: number): Promise<ProjectStage> {
    return this.prisma.projectStage.delete({
      where: { id },
    });
  }

  // Tags
  async getAllTags(): Promise<Tag[]> {
    return this.prisma.tag.findMany();
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