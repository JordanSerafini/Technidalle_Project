import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Deal } from '../entities/deal.entity';
import { ConstructionSite } from '../entities/construction-site.entity';
import { DealColleague } from '../entities/deal-colleague.entity';
import { DealCustomer } from '../entities/deal-customer.entity';
import { DealSupplier } from '../entities/deal-supplier.entity';
import { DealItem } from '../entities/deal-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Deal,
      ConstructionSite,
      DealColleague,
      DealCustomer,
      DealSupplier,
      DealItem
    ])
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService]
})
export class ProjectsModule {} 