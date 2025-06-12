import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Deal } from '../entities/deal.entity';
import { ConstructionSite } from '../entities/construction-site.entity';
import { DealColleague } from '../entities/deal-colleague.entity';
import { DealCustomer } from '../entities/deal-customer.entity';
import { DealSupplier } from '../entities/deal-supplier.entity';
import { DealItem } from '../entities/deal-item.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(ConstructionSite)
    private readonly constructionSiteRepository: Repository<ConstructionSite>,
    @InjectRepository(DealColleague)
    private readonly dealColleagueRepository: Repository<DealColleague>,
    @InjectRepository(DealCustomer)
    private readonly dealCustomerRepository: Repository<DealCustomer>,
    @InjectRepository(DealSupplier)
    private readonly dealSupplierRepository: Repository<DealSupplier>,
    @InjectRepository(DealItem)
    private readonly dealItemRepository: Repository<DealItem>,
  ) {}

  async findAll(query: any = {}): Promise<{ data: Deal[]; total: number }> {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status, 
      commercialId, 
      clientId,
      dateFrom,
      dateTo,
      sortBy = 'DealDate',
      sortOrder = 'DESC'
    } = query;
    
    const skip = (page - 1) * limit;

    const queryBuilder = this.dealRepository.createQueryBuilder('deal');

    if (search) {
      queryBuilder.where(
        'deal.Caption ILIKE :search OR deal.xx_Client ILIKE :search OR deal.Id ILIKE :search',
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere('deal.DealState = :status', { status });
    }

    if (commercialId) {
      queryBuilder.andWhere('deal.xx_Commercial = :commercialId', { commercialId });
    }

    if (clientId) {
      queryBuilder.andWhere('deal.xx_Client = :clientId', { clientId });
    }

    if (dateFrom && dateTo) {
      queryBuilder.andWhere('deal.DealDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo
      });
    }

    queryBuilder
      .orderBy(`deal.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    // Enrichir les données pour le mobile
    const enrichedData = data.map(deal => ({
      ...deal,
      displayName: deal.displayName,
      statusText: deal.statusText,
      isActive: deal.isActive,
      isCompleted: deal.isCompleted,
      progressPercentage: deal.progressPercentage,
      marginPercentage: deal.marginPercentage,
      isOverBudget: deal.isOverBudget,
      clientName: deal.clientName,
      commercialName: deal.commercialName,
      serviceBTP: deal.serviceBTP,
      daysRemaining: deal.daysRemaining,
      isLate: deal.isLate,
      totalTimeRealised: deal.totalTimeRealised,
    }));

    return { data: enrichedData, total };
  }

  async findOne(id: string): Promise<Deal> {
    const deal = await this.dealRepository.findOne({
      where: { Id: id },
      relations: ['colleagues', 'customers', 'suppliers', 'items', 'constructionSites'],
    });

    if (!deal) {
      throw new NotFoundException(`Projet avec l'ID ${id} non trouvé`);
    }

    return deal;
  }

  async findByCommercial(commercialId: string): Promise<Deal[]> {
    return this.dealRepository.find({
      where: { xx_Commercial: commercialId, DealState: 1 }, // Projets actifs seulement
      order: { DealDate: 'DESC' },
      take: 50
    });
  }

  async findByClient(clientId: string): Promise<Deal[]> {
    return this.dealRepository.find({
      where: { xx_Client: clientId },
      order: { DealDate: 'DESC' },
      take: 50
    });
  }

  async findActiveProjects(): Promise<Deal[]> {
    return this.dealRepository.find({
      where: { DealState: 1 },
      order: { DealDate: 'DESC' },
      take: 100
    });
  }

  async findProjectsOverBudget(): Promise<Deal[]> {
    return this.dealRepository
      .createQueryBuilder('deal')
      .where('deal.AccomplishedCosts > deal.PredictedCosts')
      .andWhere('deal.DealState = 1')
      .orderBy('(deal.AccomplishedCosts - deal.PredictedCosts)', 'DESC')
      .take(20)
      .getMany();
  }

  async findProjectsNearDeadline(days: number = 7): Promise<Deal[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return this.dealRepository
      .createQueryBuilder('deal')
      .where('deal.xx_DateFin <= :targetDate', { targetDate })
      .andWhere('deal.DealState = 1')
      .orderBy('deal.xx_DateFin', 'ASC')
      .take(20)
      .getMany();
  }

  async getProjectStats(): Promise<any> {
    const [total, active, completed, overBudget, delayed] = await Promise.all([
      this.dealRepository.count(),
      this.dealRepository.count({ where: { DealState: 1 } }),
      this.dealRepository.count({ where: { DealState: 2 } }),
      this.dealRepository
        .createQueryBuilder('deal')
        .where('deal.AccomplishedCosts > deal.PredictedCosts')
        .getCount(),
      this.dealRepository
        .createQueryBuilder('deal')
        .where('deal.xx_DateFin < :today', { today: new Date() })
        .andWhere('deal.DealState = 1')
        .getCount()
    ]);

    // Statistiques par service BTP
    const byService = await this.dealRepository
      .createQueryBuilder('deal')
      .select(['deal.xx_Service as service', 'COUNT(deal.Id) as count'])
      .where('deal.DealState = 1')
      .groupBy('deal.xx_Service')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Chiffre d'affaires par mois
    const monthlyRevenue = await this.dealRepository
      .createQueryBuilder('deal')
      .select([
        'EXTRACT(YEAR FROM deal.DealDate) as year',
        'EXTRACT(MONTH FROM deal.DealDate) as month',
        'SUM(deal.AccomplishedSales) as revenue'
      ])
      .where('deal.DealDate >= :startDate', { 
        startDate: new Date(new Date().getFullYear(), 0, 1) 
      })
      .groupBy('EXTRACT(YEAR FROM deal.DealDate), EXTRACT(MONTH FROM deal.DealDate)')
      .orderBy('year, month', 'ASC')
      .getRawMany();

    return {
      total,
      active,
      completed,
      overBudget,
      delayed,
      byService: byService.map(s => ({
        service: s.service || 'Non classé',
        count: parseInt(s.count)
      })),
      monthlyRevenue: monthlyRevenue.map(m => ({
        year: parseInt(m.year),
        month: parseInt(m.month),
        revenue: parseFloat(m.revenue) || 0
      }))
    };
  }

  async getConstructionSites(dealId: string): Promise<ConstructionSite[]> {
    return this.constructionSiteRepository.find({
      where: { DealId: dealId },
      order: { sysCreatedDate: 'DESC' }
    });
  }

  async getProjectTeam(dealId: string): Promise<DealColleague[]> {
    return this.dealColleagueRepository.find({
      where: { DealId: dealId },
      order: { IsManager: 'DESC', Role: 'ASC' }
    });
  }

  async getProjectSuppliers(dealId: string): Promise<DealSupplier[]> {
    return this.dealSupplierRepository.find({
      where: { DealId: dealId },
      order: { BudgetAmount: 'DESC' }
    });
  }

  async getProjectItems(dealId: string): Promise<DealItem[]> {
    return this.dealItemRepository.find({
      where: { DealId: dealId },
      order: { Category: 'ASC', TotalPrice: 'DESC' }
    });
  }

  async search(searchTerm: string): Promise<Deal[]> {
    return this.dealRepository.find({
      where: [
        { Caption: Like(`%${searchTerm}%`) },
        { Id: Like(`%${searchTerm}%`) },
        { xx_Client: Like(`%${searchTerm}%`) },
        { xx_Commercial: Like(`%${searchTerm}%`) },
      ],
      take: 20,
      order: { DealDate: 'DESC' },
    });
  }

  async create(createProjectDto: CreateProjectDto): Promise<Deal> {
    const deal = this.dealRepository.create({
      ...createProjectDto,
      DealState: 1, // Par défaut : En cours
      sysCreatedDate: new Date(),
      sysCreatedUser: 'mobile-app'
    });
    return await this.dealRepository.save(deal);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Deal> {
    const deal = await this.findOne(id);
    Object.assign(deal, {
      ...updateProjectDto,
      sysModifiedDate: new Date(),
      sysModifiedUser: 'mobile-app'
    });
    return await this.dealRepository.save(deal);
  }

  async remove(id: string): Promise<{ deleted: boolean; id: string }> {
    // Soft delete : changer le statut au lieu de supprimer
    await this.dealRepository.update(id, { 
      DealState: 4, // Annulé
      sysModifiedDate: new Date(),
      sysModifiedUser: 'mobile-app'
    });
    return { deleted: true, id };
  }

  async updateProgress(id: string, progressData: any): Promise<Deal> {
    const deal = await this.findOne(id);
    
    Object.assign(deal, {
      AccomplishedCosts: progressData.accomplishedCosts,
      AccomplishedSales: progressData.accomplishedSales,
      AccomplishedDuration: progressData.accomplishedDuration,
      xx_Total_Temps_Realise: progressData.totalTimeRealized,
      sysModifiedDate: new Date(),
      sysModifiedUser: 'mobile-app'
    });

    return await this.dealRepository.save(deal);
  }
} 