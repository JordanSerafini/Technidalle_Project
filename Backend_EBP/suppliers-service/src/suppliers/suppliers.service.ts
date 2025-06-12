import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';
import { SupplierFamily } from '../entities/supplier-family.entity';
import { SupplierItem } from '../entities/supplier-item.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(SupplierFamily)
    private readonly supplierFamilyRepository: Repository<SupplierFamily>,
    @InjectRepository(SupplierItem)
    private readonly supplierItemRepository: Repository<SupplierItem>,
  ) {}

  async findAll(query: any = {}): Promise<{ data: Supplier[]; total: number }> {
    const { page = 1, limit = 20, search, familyId, activeOnly = true, sortBy = 'Name' } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.supplierRepository.createQueryBuilder('supplier')
      .leftJoinAndSelect('supplier.family', 'family');

    if (search) {
      queryBuilder.where(
        'supplier.Name ILIKE :search OR supplier.Siren ILIKE :search OR supplier.MainInvoicingContact_Email ILIKE :search',
        { search: `%${search}%` }
      );
    }

    if (familyId) {
      queryBuilder.andWhere('supplier.FamilyId = :familyId', { familyId });
    }

    if (activeOnly) {
      queryBuilder.andWhere('supplier.ActiveState = 1');
    }

    queryBuilder
      .orderBy(`supplier.${sortBy}`, 'ASC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    // Enrichir les données pour le mobile
    const enrichedData = data.map(supplier => ({
      ...supplier,
      displayName: supplier.displayName,
      isActive: supplier.isActive,
      fullAddress: supplier.fullAddress,
      mainContact: supplier.mainContact,
      lastModified: supplier.sysModifiedDate || supplier.sysCreatedDate,
    }));

    return { data: enrichedData, total };
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { Id: id },
      relations: ['family', 'items'],
    });

    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }

    return supplier;
  }

  async findByFamily(familyId: string): Promise<Supplier[]> {
    return this.supplierRepository.find({
      where: { FamilyId: familyId, ActiveState: 1 },
      order: { Name: 'ASC' },
      take: 50
    });
  }

  async findItemsBySupplier(supplierId: string): Promise<SupplierItem[]> {
    return this.supplierItemRepository.find({
      where: { SupplierId: supplierId },
      order: { IsMainSupplier: 'DESC', PurchasePrice: 'ASC' },
      take: 100
    });
  }

  async search(searchTerm: string): Promise<Supplier[]> {
    return this.supplierRepository.find({
      where: [
        { Name: Like(`%${searchTerm}%`) },
        { Siren: Like(`%${searchTerm}%`) },
        { MainInvoicingContact_Email: Like(`%${searchTerm}%`) },
        { MainInvoicingContact_Name: Like(`%${searchTerm}%`) },
      ],
      relations: ['family'],
      take: 20,
      order: { Name: 'ASC' },
    });
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number = 50): Promise<Supplier[]> {
    // Recherche géolocalisée des fournisseurs proches
    // Approximation simple avec lat/lng (pour une solution plus précise, utiliser PostGIS)
    const latRange = radiusKm / 111; // 1 degré ≈ 111 km
    const lngRange = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    return this.supplierRepository
      .createQueryBuilder('supplier')
      .where('supplier.ActiveState = 1')
      .andWhere('supplier.MainInvoicingAddress_Latitude IS NOT NULL')
      .andWhere('supplier.MainInvoicingAddress_Longitude IS NOT NULL')
      .andWhere(`supplier.MainInvoicingAddress_Latitude BETWEEN :latMin AND :latMax`, {
        latMin: latitude - latRange,
        latMax: latitude + latRange
      })
      .andWhere(`supplier.MainInvoicingAddress_Longitude BETWEEN :lngMin AND :lngMax`, {
        lngMin: longitude - lngRange,
        lngMax: longitude + lngRange
      })
      .leftJoinAndSelect('supplier.family', 'family')
      .orderBy('supplier.Name', 'ASC')
      .take(50)
      .getMany();
  }

  async getSupplierStats(): Promise<any> {
    const [total, active, byFamily] = await Promise.all([
      this.supplierRepository.count(),
      this.supplierRepository.count({ where: { ActiveState: 1 } }),
      this.supplierRepository
        .createQueryBuilder('supplier')
        .leftJoin('supplier.family', 'family')
        .select(['family.Caption as familyName', 'COUNT(supplier.Id) as count'])
        .where('supplier.ActiveState = 1')
        .groupBy('family.Caption')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany()
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byFamily: byFamily.map(f => ({
        family: f.familyName || 'Non classé',
        count: parseInt(f.count)
      }))
    };
  }

  async getFamilies(): Promise<SupplierFamily[]> {
    return this.supplierFamilyRepository.find({
      where: { ActiveState: 1 },
      order: { Caption: 'ASC' }
    });
  }

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.supplierRepository.create({
      ...createSupplierDto,
      ActiveState: 1,
      sysCreatedDate: new Date(),
      sysCreatedUser: 'mobile-app'
    });
    return await this.supplierRepository.save(supplier);
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);
    Object.assign(supplier, {
      ...updateSupplierDto,
      sysModifiedDate: new Date(),
      sysModifiedUser: 'mobile-app'
    });
    return await this.supplierRepository.save(supplier);
  }

  async remove(id: string): Promise<{ deleted: boolean; id: string }> {
    // Soft delete : désactiver au lieu de supprimer
    await this.supplierRepository.update(id, { 
      ActiveState: 0,
      sysModifiedDate: new Date(),
      sysModifiedUser: 'mobile-app'
    });
    return { deleted: true, id };
  }
} 