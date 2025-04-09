import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.materials.findMany();
  }

  async findOne(id: string) {
    const materialId = parseInt(id);
    const material = await this.prisma.materials.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      throw new NotFoundException(`Matériau avec l'ID ${id} non trouvé`);
    }

    return material;
  }

  async create(createMaterialDto: CreateMaterialDto) {
    return this.prisma.materials.create({
      data: {
        name: createMaterialDto.name,
        description: createMaterialDto.description,
        unit: createMaterialDto.unit,
        price: createMaterialDto.unitPrice,
        stock_quantity: 0,
        minimum_stock: 0,
      },
    });
  }

  async update(id: string, updateMaterialDto: UpdateMaterialDto) {
    try {
      const materialId = parseInt(id);
      const data: any = {};
      
      if (updateMaterialDto.name) {
        data.name = updateMaterialDto.name;
      }
      
      if (updateMaterialDto.description !== undefined) {
        data.description = updateMaterialDto.description;
      }
      
      if (updateMaterialDto.unit) {
        data.unit = updateMaterialDto.unit;
      }
      
      if (updateMaterialDto.unitPrice) {
        data.price = updateMaterialDto.unitPrice;
      }
      
      return await this.prisma.materials.update({
        where: { id: materialId },
        data,
      });
    } catch (_) {
      throw new NotFoundException(`Matériau avec l'ID ${id} non trouvé`);
    }
  }

  async remove(id: string) {
    try {
      const materialId = parseInt(id);
      return await this.prisma.materials.delete({
        where: { id: materialId },
      });
    } catch (_) {
      throw new NotFoundException(`Matériau avec l'ID ${id} non trouvé`);
    }
  }
}
