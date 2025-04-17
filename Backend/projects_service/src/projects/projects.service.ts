import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  // Projects
  async getAllProjects(limit?: number, offset?: number, searchQuery?: string) {
    return await this.prisma.projects.findMany({
      where: searchQuery
        ? {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' } },
              { description: { contains: searchQuery, mode: 'insensitive' } },
              { reference: { contains: searchQuery, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        project_stages: true,
        project_tags: {
          include: {
            tags: true,
          },
        },
      },
      skip: offset || 0,
      take: limit || undefined,
    });
  }

  async getProjectById(id: number) {
    return await this.prisma.projects.findUnique({
      where: { id },
      include: {
        project_stages: true,
        project_tags: {
          include: {
            tags: true,
          },
        },
      },
    });
  }

  async getProjectsByClientId(
    clientId: number,
    limit?: number,
    offset?: number,
  ) {
    return await this.prisma.projects.findMany({
      where: { client_id: clientId },
      include: {
        project_stages: true,
        project_tags: {
          include: {
            tags: true,
          },
        },
      },
      skip: offset || 0,
      take: limit || undefined,
    });
  }

  async createProject(data: any) {
    const prismaData: Prisma.projectsCreateInput = {
      reference: data.reference,
      name: data.name,
      description: data.description,
      clients: {
        connect: { id: data.clientId },
      },
      // Champs optionnels
      ...(data.addressId && {
        addresses: {
          connect: { id: data.addressId },
        },
      }),
      status: data.status,
      start_date: data.startDate ? new Date(data.startDate) : undefined,
      end_date: data.endDate ? new Date(data.endDate) : undefined,
      estimated_duration: data.estimatedDuration,
      budget: data.budget,
      actual_cost: data.actualCost,
      margin: data.margin,
      priority: data.priority,
      notes: data.notes,
    };

    return await this.prisma.projects.create({ data: prismaData });
  }

  async updateProject(id: number, data: Prisma.projectsUpdateInput) {
    return await this.prisma.projects.update({
      where: { id },
      data,
    });
  }

  async deleteProject(id: number) {
    return await this.prisma.projects.delete({
      where: { id },
    });
  }

  // Stages
  async getStagesByProjectId(projectId: number) {
    return await this.prisma.project_stages.findMany({
      where: { project_id: projectId },
      include: {
        stage_tags: {
          include: {
            tags: true,
          },
        },
      },
    });
  }

  async createStage(projectId: number, data: Prisma.project_stagesCreateInput) {
    return await this.prisma.project_stages.create({
      data: {
        ...data,
        projects: {
          connect: { id: projectId },
        },
      },
    });
  }

  async updateStage(id: number, data: Prisma.project_stagesUpdateInput) {
    return await this.prisma.project_stages.update({
      where: { id },
      data,
    });
  }

  async deleteStage(id: number) {
    return await this.prisma.project_stages.delete({
      where: { id },
    });
  }

  // Tags
  async getAllTags() {
    return await this.prisma.tags.findMany();
  }

  async addTagToProject(projectId: number, tagId: number): Promise<void> {
    await this.prisma.project_tags.create({
      data: {
        projects: { connect: { id: projectId } },
        tags: { connect: { id: tagId } },
      },
    });
  }

  async removeTagFromProject(projectId: number, tagId: number): Promise<void> {
    await this.prisma.project_tags.delete({
      where: {
        project_id_tag_id: {
          project_id: projectId,
          tag_id: tagId,
        },
      },
    });
  }
}
