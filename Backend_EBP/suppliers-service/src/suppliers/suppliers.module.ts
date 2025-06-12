import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { Supplier } from '../entities/supplier.entity';
import { SupplierFamily } from '../entities/supplier-family.entity';
import { SupplierItem } from '../entities/supplier-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supplier,
      SupplierFamily,
      SupplierItem
    ])
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService]
})
export class SuppliersModule {} 