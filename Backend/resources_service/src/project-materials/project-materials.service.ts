import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MaterialsService } from '../materials/materials.service';
import { CreateProjectMaterialDto } from './dto/create-project-material.dto';
import { UpdateProjectMaterialDto } from './dto/update-project-material.dto';

@Injectable()
export class ProjectMaterialsService {
  constructor(
    private prisma: PrismaService,
    private materialsService: MaterialsService,
  ) {}

  async findAllByProjectId(
    projectId: string,
    limit?: number,
    offset?: number,
    searchQuery?: string,
  ) {
    const projectIdNumber = parseInt(projectId);
    return this.prisma.project_materials.findMany({
      where: {
        project_id: projectIdNumber,
        ...(searchQuery
          ? {
              OR: [
                { materials: { name: { contains: searchQuery } } },
                { materials: { description: { contains: searchQuery } } },
                { materials: { reference: { contains: searchQuery } } },
              ],
            }
          : {}),
      },
      include: { materials: true },
      skip: offset || 0,
      take: limit || undefined,
    });
  }

  async findOne(projectId: string, materialId: string) {
    const projectIdNumber = parseInt(projectId);
    const materialIdNumber = parseInt(materialId);

    const projectMaterial = await this.prisma.project_materials.findFirst({
      where: {
        AND: [
          { project_id: projectIdNumber },
          { material_id: materialIdNumber },
        ],
      },
      include: { materials: true },
    });

    if (!projectMaterial) {
      throw new NotFoundException(
        `Matériau avec l'ID ${materialId} non trouvé pour le projet ${projectId}`,
      );
    }

    return projectMaterial;
  }

  async create(
    projectId: string,
    createProjectMaterialDto: CreateProjectMaterialDto,
  ) {
    // Vérifier que le matériau existe
    await this.materialsService.findOne(createProjectMaterialDto.materialId);

    const projectIdNumber = parseInt(projectId);
    const materialIdNumber = parseInt(createProjectMaterialDto.materialId);

    // Récupérer le prix unitaire du matériau
    const material = await this.prisma.materials.findUnique({
      where: { id: materialIdNumber },
    });

    if (!material) {
      throw new NotFoundException(
        `Matériau avec l'ID ${createProjectMaterialDto.materialId} non trouvé`,
      );
    }

    return this.prisma.project_materials.create({
      data: {
        project_id: projectIdNumber,
        material_id: materialIdNumber,
        quantity_planned: createProjectMaterialDto.quantity,
        quantity_used: 0,
        unit_price: material.price || 0,
      },
      include: { materials: true },
    });
  }

  async update(
    projectId: string,
    materialId: string,
    updateProjectMaterialDto: UpdateProjectMaterialDto,
  ) {
    try {
      const projectIdNumber = parseInt(projectId);
      const materialIdNumber = parseInt(materialId);

      const data: any = {};

      if (updateProjectMaterialDto.quantity) {
        data.quantity_planned = updateProjectMaterialDto.quantity;
      }

      return await this.prisma.project_materials.updateMany({
        where: {
          AND: [
            { project_id: projectIdNumber },
            { material_id: materialIdNumber },
          ],
        },
        data,
      });
    } catch (e) {
      console.log(e);
      throw new NotFoundException(
        `Matériau avec l'ID ${materialId} non trouvé pour le projet ${projectId}`,
      );
    }
  }

  async remove(projectId: string, materialId: string) {
    try {
      const projectIdNumber = parseInt(projectId);
      const materialIdNumber = parseInt(materialId);

      return await this.prisma.project_materials.deleteMany({
        where: {
          AND: [
            { project_id: projectIdNumber },
            { material_id: materialIdNumber },
          ],
        },
      });
    } catch (e) {
      console.log(e);
      throw new NotFoundException(
        `Matériau avec l'ID ${materialId} non trouvé pour le projet ${projectId}`,
      );
    }
  }
}
