import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Controller()
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @MessagePattern({ cmd: 'get_all_materials' })
  async findAll(data?: { limit?: number; offset?: number; searchQuery?: string }) {
    return this.materialsService.findAll(data?.limit, data?.offset, data?.searchQuery);
  }

  @MessagePattern({ cmd: 'get_material_by_id' })
  async findOne(data: { id: string }) {
    return this.materialsService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'create_material' })
  async create(data: CreateMaterialDto) {
    return this.materialsService.create(data);
  }

  @MessagePattern({ cmd: 'update_material' })
  async update(data: { id: string; materialDto: UpdateMaterialDto }) {
    return this.materialsService.update(data.id, data.materialDto);
  }

  @MessagePattern({ cmd: 'delete_material' })
  async remove(data: { id: string }) {
    return this.materialsService.remove(data.id);
  }
}
