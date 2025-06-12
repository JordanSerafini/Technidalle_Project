import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  // REST Endpoints pour API Gateway
  @Get()
  async findAll(@Query() query: any) {
    return this.suppliersService.findAll(query);
  }

  @Get('families')
  async getFamilies() {
    return this.suppliersService.getFamilies();
  }

  @Get('stats')
  async getStats() {
    return this.suppliersService.getSupplierStats();
  }

  @Get('search')
  async search(@Query('q') searchTerm: string) {
    return this.suppliersService.search(searchTerm);
  }

  @Get('nearby')
  async findNearby(
    @Query('lat') latitude: number,
    @Query('lng') longitude: number,
    @Query('radius') radius?: number
  ) {
    return this.suppliersService.findNearby(latitude, longitude, radius);
  }

  @Get('family/:familyId')
  async findByFamily(@Param('familyId') familyId: string) {
    return this.suppliersService.findByFamily(familyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Get(':id/items')
  async getSupplierItems(@Param('id') id: string) {
    return this.suppliersService.findItemsBySupplier(id);
  }

  @Post()
  async create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }

  // Microservice Message Patterns
  @MessagePattern('suppliers.findAll')
  async findAllMicroservice(@Payload() query: any) {
    return this.suppliersService.findAll(query);
  }

  @MessagePattern('suppliers.findOne')
  async findOneMicroservice(@Payload() id: string) {
    return this.suppliersService.findOne(id);
  }

  @MessagePattern('suppliers.findByFamily')
  async findByFamilyMicroservice(@Payload() familyId: string) {
    return this.suppliersService.findByFamily(familyId);
  }

  @MessagePattern('suppliers.search')
  async searchMicroservice(@Payload() searchTerm: string) {
    return this.suppliersService.search(searchTerm);
  }

  @MessagePattern('suppliers.findNearby')
  async findNearbyMicroservice(@Payload() data: { latitude: number; longitude: number; radius?: number }) {
    return this.suppliersService.findNearby(data.latitude, data.longitude, data.radius);
  }

  @MessagePattern('suppliers.getItems')
  async getItemsMicroservice(@Payload() supplierId: string) {
    return this.suppliersService.findItemsBySupplier(supplierId);
  }

  @MessagePattern('suppliers.getStats')
  async getStatsMicroservice() {
    return this.suppliersService.getSupplierStats();
  }

  @MessagePattern('suppliers.getFamilies')
  async getFamiliesMicroservice() {
    return this.suppliersService.getFamilies();
  }

  @MessagePattern('suppliers.create')
  async createMicroservice(@Payload() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @MessagePattern('suppliers.update')
  async updateMicroservice(@Payload() data: { id: string; updateSupplierDto: UpdateSupplierDto }) {
    return this.suppliersService.update(data.id, data.updateSupplierDto);
  }

  @MessagePattern('suppliers.delete')
  async deleteMicroservice(@Payload() id: string) {
    return this.suppliersService.remove(id);
  }
} 